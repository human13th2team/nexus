"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Hash, 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  ChevronLeft,
  Smile,
  Paperclip,
  Image as ImageIcon,
  MessageSquare,
  File,
  Download,
  LogOut
} from 'lucide-react';
import ChatService from '@/lib/chat/chatService';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  message: string;
  createdAt: string;
  type: 'TALK' | 'ENTER' | 'LEAVE' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
}

interface ChatRoomResponseDto {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  unreadCount?: number;
  participantCount?: number;
  type: 'GROUP' | 'PRIVATE';
}

const ChatComponent = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<'GROUP' | 'PRIVATE'>('GROUP');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<ChatRoomResponseDto | null>(null);
  
  const chatServiceRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 초기화: 로컬 스토리지에서 사용자 정보 로드
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      const storedUserId = localStorage.getItem('userId');
      const storedNickname = localStorage.getItem('nickname');
      
      if (storedUserId) {
        setCurrentUserId(storedUserId);
        setCurrentNickname(storedNickname || '익명');
        fetchMyRooms(storedUserId);
      } else {
        // 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
        router.push('/auth/login');
      }
      setIsLoading(false);
    };

    initAuth();
    window.addEventListener('storage', initAuth);
    return () => window.removeEventListener('storage', initAuth);
  }, [router]);

  // 2. 초기 데이터 로드 (내 채팅방 목록)
  const fetchMyRooms = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/chat/rooms/mine?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        if (data.length > 0 && !activeRoomId) {
          setActiveRoomId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]); // 서버 오류 시 목록을 비움
    }
  };

  const fetchAllRooms = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/chat/rooms`);
      if (response.ok) {
        const data = await response.json();
        setAllRooms(data);
      }
    } catch (error) {
      console.error("Failed to fetch all rooms:", error);
    }
  };

  const handleJoinRoom = (room: ChatRoomResponseDto) => {
    setJoiningRoom(room);
    setConfirmModalOpen(true);
  };

  const confirmJoinRoom = async () => {
    if (!currentUserId || !joiningRoom) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/chat/rooms/${joiningRoom.id}/join?userId=${currentUserId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchMyRooms(currentUserId);
        setActiveRoomId(joiningRoom.id);
        setShowAllRooms(false);
        setConfirmModalOpen(false);
        setJoiningRoom(null);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  const handleLeaveRoom = () => {
    const activeRoom = rooms.find(r => r.id === activeRoomId);
    if (!activeRoom || activeRoom.type !== 'GROUP') return;
    setLeaveModalOpen(true);
  };

  const confirmLeaveRoom = async () => {
    if (!activeRoomId || !currentUserId) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/chat/rooms/${activeRoomId}/leave?userId=${currentUserId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchMyRooms(currentUserId);
        setActiveRoomId(null);
        setLeaveModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  // 3. 채팅방 변경 시 메시지 내역 로드 및 구독
  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    // 기존 연결 종료
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
    }

    // 메시지 내역 불러오기
    fetchMessages(activeRoomId);

    // 새 연결 시작
    const chatService = new ChatService();
    chatService.connect(
      (message: any) => {
        // 1. 현재 채팅창 메시지 추가
        setMessages(prev => [...prev, message]);
        scrollToBottom();

        // 2. 왼쪽 채팅방 목록 실시간 업데이트 (미리보기 및 정렬)
        setRooms(prevRooms => {
          const updatedRooms = prevRooms.map(room => {
            if (room.id === message.roomId) {
              return {
                ...room,
                lastMessage: message.type === 'IMAGE' ? '(사진)' : 
                             message.type === 'FILE' ? '(파일)' : message.message,
                lastMessageAt: message.createdAt
              };
            }
            return room;
          });
          // 최신 메시지 순으로 다시 정렬
          return [...updatedRooms].sort((a, b) => {
            const t1 = new Date(a.lastMessageAt || a.createdAt).getTime();
            const t2 = new Date(b.lastMessageAt || b.createdAt).getTime();
            return t2 - t1;
          });
        });
      },
      activeRoomId,
      () => setIsConnected(true)
    );
    chatServiceRef.current = chatService;

    return () => {
      chatService.disconnect();
      setIsConnected(false);
    };
  }, [activeRoomId, currentUserId]);

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/chat/rooms/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      }
    } catch (error) {
      setMessages([]); // Clear if error
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeRoomId || !currentUserId || !chatServiceRef.current) return;

    chatServiceRef.current.sendMessage(
      activeRoomId,
      currentUserId,
      inputValue,
      'TALK'
    );
    setInputValue('');
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newRoomTitle.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/api/v1/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRoomTitle,
          type: newRoomType,
          description: newRoomDescription,
          imageUrl: newRoomImageUrl,
          creatorId: currentUserId
        }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms(prev => [newRoom, ...prev]);
        setActiveRoomId(newRoom.id);
        setIsCreateModalOpen(false);
        setNewRoomTitle('');
        setNewRoomDescription('');
        setNewRoomImageUrl('');
        setNewRoomType('GROUP');
      }
    } catch (error) {
      alert("방 생성에 실패했습니다.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 서버 업로드
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewRoomImageUrl(data.url);
      } else {
        alert("이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileMessageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (!file || !activeRoomId || !currentUserId || !chatServiceRef.current) {
      console.log("Missing required data:", { file, activeRoomId, currentUserId, connected: !!chatServiceRef.current });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("Uploading file...");
      const response = await fetch('http://localhost:8080/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload success:", data);
        const fileUrl = data.url;
        const fileName = file.name;
        const isImage = file.type.startsWith('image/');
        
        console.log("Sending file message:", {
          activeRoomId,
          currentUserId,
          text: isImage ? '사진을 보냈습니다.' : `파일을 보냈습니다: ${fileName}`,
          type: isImage ? 'IMAGE' : 'FILE',
          fileUrl,
          fileName
        });

        chatServiceRef.current.sendMessage(
          activeRoomId,
          currentUserId,
          isImage ? '사진을 보냈습니다.' : `파일을 보냈습니다: ${fileName}`,
          isImage ? 'IMAGE' : 'FILE',
          fileUrl,
          fileName
        );
      } else {
        console.error("Upload failed with status:", response.status);
        alert("파일 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("File upload error:", error);
    } finally {
      // 같은 파일을 다시 선택해도 이벤트가 발생하도록 초기화
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#F0F2F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#F8F9FA]">
        <div className="text-center p-12 bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-zinc-100 max-w-md w-full">
          <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-zinc-300" />
          </div>
          <h2 className="text-2xl font-black mb-3 tracking-tight">로그인이 필요합니다</h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
            NEXUS 커뮤니티 채팅을 이용하시려면<br/>먼저 로그인해 주세요.
          </p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden font-inter">
      {/* 1. 사이드바 - 채팅방 목록 */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-zinc-100 flex flex-col bg-[#FAFAFA]`}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black tracking-tighter">Messages</h1>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-90"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex gap-2 mb-6 p-1 bg-zinc-100 rounded-xl">
            <button 
              onClick={() => setShowAllRooms(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!showAllRooms ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              내 채팅
            </button>
            <button 
              onClick={() => {
                setShowAllRooms(true);
                fetchAllRooms();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${showAllRooms ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              전체 탐색
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text" 
              placeholder={showAllRooms ? "Search all rooms..." : "Search my chats..."}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-200 rounded-xl text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {(showAllRooms ? allRooms : rooms).map(room => (
            <button
              key={room.id}
              onClick={() => {
                if (showAllRooms) {
                  const isJoined = rooms.some(r => r.id === room.id);
                  if (isJoined) {
                    setActiveRoomId(room.id);
                    setShowAllRooms(false);
                  } else {
                    handleJoinRoom(room);
                  }
                } else {
                  setActiveRoomId(room.id);
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                activeRoomId === room.id 
                ? 'bg-white shadow-lg shadow-black/5 border border-zinc-100' 
                : 'hover:bg-zinc-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden ${
                room.imageUrl ? 'bg-transparent' : (room.type === 'GROUP' ? 'bg-zinc-900' : 'bg-zinc-400')
              }`}>
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.title} className="w-full h-full object-cover" />
                ) : (
                  room.type === 'GROUP' ? <Hash size={20} /> : room.title[0]
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-sm truncate">{room.title}</span>
                    <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                      {room.participantCount || 0}명
                    </span>
                  </div>
                  {!showAllRooms && room.lastMessageAt && (
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                      {new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {showAllRooms && !rooms.some(r => r.id === room.id) && (
                    <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap">JOIN</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                  {showAllRooms 
                    ? (room.description || '상세 설명이 없는 채팅방입니다.') 
                    : (room.lastMessage || '새로운 대화를 시작해보세요!')}
                </p>
              </div>
            </button>
          ))}
          {showAllRooms && allRooms.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-zinc-400">개설된 방이 없습니다.</p>
            </div>
          )}
          {!showAllRooms && rooms.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-zinc-400">참여 중인 방이 없습니다.<br/>'전체 탐색'에서 찾아보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* 채팅창 헤더 */}
            <div className="h-20 px-6 border-b border-zinc-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-zinc-50 rounded-xl transition-colors md:hidden"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-bold text-zinc-500 overflow-hidden">
                  {activeRoom.imageUrl ? (
                    <img src={activeRoom.imageUrl} alt={activeRoom.title} className="w-full h-full object-cover" />
                  ) : (
                    activeRoom.type === 'GROUP' ? <Hash size={20} /> : <Users size={20} />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-base tracking-tight">{activeRoom.title}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`}></div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {isConnected ? 'Online' : 'Connecting...'}
                      {activeRoom.participantCount && ` • ${activeRoom.participantCount} Members`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {rooms.find(r => r.id === activeRoomId)?.type === 'GROUP' && (
                  <button 
                    onClick={handleLeaveRoom}
                    className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all flex items-center gap-2 group"
                    title="방 나가기"
                  >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    <span className="text-xs font-bold hidden sm:inline">나가기</span>
                  </button>
                )}
                <button className="p-2.5 rounded-xl text-zinc-400 hover:bg-zinc-100 transition-all">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* 메시지 리스트 */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]/50 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="text-sm font-bold">이 채팅방의 첫 번째 메시지를 보내보세요</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;

                return (
                  <div 
                    key={msg.id || idx} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && showAvatar && (
                      <span className="text-[11px] font-bold text-zinc-400 mb-1.5 ml-1">
                        {msg.senderNickname}
                      </span>
                    )}
                    <div className={`max-w-[70%] group relative rounded-2xl text-sm font-medium leading-relaxed overflow-hidden ${
                      isMe 
                      ? 'bg-black text-white rounded-tr-none shadow-xl shadow-black/10' 
                      : 'bg-white text-zinc-800 rounded-tl-none shadow-lg shadow-black/5 border border-zinc-100'
                    }`}>
                      {msg.type === 'IMAGE' && msg.fileUrl ? (
                        <div className="flex flex-col">
                          <img 
                            src={msg.fileUrl} 
                            alt="Shared Image" 
                            className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImageUrl(msg.fileUrl!)}
                          />
                          <div className="px-4 py-2 text-[11px] opacity-70">
                            {msg.message}
                          </div>
                        </div>
                      ) : msg.type === 'FILE' && msg.fileUrl ? (
                        <div className="p-4 flex items-center gap-3 min-w-[200px]">
                          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500">
                            <File size={20} />
                          </div>
                          <div className="flex-1 truncate">
                            <p className="text-xs font-bold truncate">{msg.fileName}</p>
                            <a 
                              href={msg.fileUrl?.replace('/display/', '/download/')} 
                              download={msg.fileName}
                              className="text-[10px] text-blue-500 font-black hover:underline mt-1 flex items-center gap-1"
                            >
                              <Download size={10} /> 다운로드
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-3">
                          {msg.message}
                        </div>
                      )}
                      <span className={`absolute bottom-[-20px] whitespace-nowrap text-[9px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isMe ? 'right-0' : 'left-0'
                      }`}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 입력 영역 */}
            <div className="p-6 bg-white">
              <form 
                onSubmit={handleSendMessage}
                className="relative bg-zinc-50 rounded-2xl border border-zinc-100 p-2 focus-within:bg-white focus-within:border-black transition-all flex items-end gap-2"
              >
                <input 
                  type="file"
                  id="chat-image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileMessageUpload(e)}
                />
                <input 
                  type="file"
                  id="chat-file-upload"
                  className="hidden"
                  onChange={(e) => handleFileMessageUpload(e)}
                />
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  className="flex-1 py-3 px-4 bg-transparent border-none focus:ring-0 text-sm resize-none font-medium placeholder:text-zinc-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    inputValue.trim() 
                    ? 'bg-black text-white hover:scale-105 active:scale-95' 
                    : 'bg-zinc-200 text-zinc-400'
                  }`}
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="flex items-center gap-4 mt-3 ml-1">
                <button 
                  type="button"
                  onClick={() => document.getElementById('chat-file-upload')?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors"
                >
                  <Paperclip size={14} /> 파일 첨부
                </button>
                <button 
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors"
                >
                  <Smile size={14} /> 이모지
                </button>
                <button 
                  type="button"
                  onClick={() => document.getElementById('chat-image-upload')?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors"
                >
                  <ImageIcon size={14} /> 이미지
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 p-12 bg-zinc-50/50">
            <div className="w-24 h-24 bg-zinc-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
               <MessageSquare size={48} className="opacity-20" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-zinc-900 mb-2">대화를 시작해보세요</h3>
            <p className="text-sm font-medium text-zinc-400 max-w-xs text-center leading-relaxed">
              사이드바에서 채팅방을 선택하거나 '+' 버튼을 눌러 새로운 그룹 대화를 시작할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      {/* 3. 채팅방 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-zinc-100 animate-in fade-in zoom-in duration-300">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter text-zinc-900">새 채팅방 개설</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-50 flex items-center justify-center transition-colors"
              >
                <Plus className="rotate-45 text-zinc-400" size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-8 pt-4 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">방 이름</label>
                <input 
                  autoFocus
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="예: 마케팅 전략 회의실"
                  className="w-full px-6 py-4 bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 rounded-2xl text-base font-bold transition-all placeholder:text-zinc-300"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">채팅 유형</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setNewRoomType('GROUP')}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all text-left ${
                      newRoomType === 'GROUP' 
                      ? 'border-black bg-black text-white shadow-xl shadow-black/10' 
                      : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                    }`}
                  >
                    <Users size={24} className={newRoomType === 'GROUP' ? 'text-white' : 'text-zinc-300'} />
                    <div className="mt-4 font-black text-sm">그룹 채팅</div>
                    <div className={`text-[10px] mt-1 font-bold ${newRoomType === 'GROUP' ? 'text-zinc-400' : 'text-zinc-300'}`}>여러 명과 대화</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewRoomType('PRIVATE')}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all text-left ${
                      newRoomType === 'PRIVATE' 
                      ? 'border-black bg-black text-white shadow-xl shadow-black/10' 
                      : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                    }`}
                  >
                    <Plus size={24} className={newRoomType === 'PRIVATE' ? 'text-white' : 'text-zinc-300'} />
                    <div className="mt-4 font-black text-sm">1:1 채팅</div>
                    <div className={`text-[10px] mt-1 font-bold ${newRoomType === 'PRIVATE' ? 'text-zinc-400' : 'text-zinc-300'}`}>비공개 대화</div>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">방 설명 (선택)</label>
                <textarea 
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="이 채팅방에서 나눌 대화에 대해 간단히 설명해주세요."
                  className="w-full px-6 py-4 bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 rounded-2xl text-sm font-medium transition-all placeholder:text-zinc-300 resize-none h-24"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">프로필 이미지</label>
                <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 transition-all group">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-zinc-100 shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Plus size={24} className="text-zinc-300 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-500 mb-2">이미지를 선택해주세요</p>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="room-image-upload"
                    />
                    <label 
                      htmlFor="room-image-upload"
                      className="inline-block px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[11px] font-black hover:bg-zinc-900 hover:text-white hover:border-black transition-all cursor-pointer shadow-sm"
                    >
                      {isUploading ? '업로드 중...' : '파일 선택'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all active:scale-95"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-2 py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/20 px-12"
                >
                  채팅방 생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 4. 이미지 확대 모달 (Lightbox) */}
      {selectedImageUrl && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedImageUrl(null)}
        >
          <button 
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:rotate-90"
            onClick={() => setSelectedImageUrl(null)}
          >
            <Plus className="rotate-45" size={32} />
          </button>
          <div 
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImageUrl} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}
      {/* 5. 입장 확인 커스텀 모달 */}
      {confirmModalOpen && joiningRoom && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-zinc-100 rounded-3xl mx-auto mb-6 flex items-center justify-center text-zinc-900 overflow-hidden shadow-inner">
                {joiningRoom.imageUrl ? (
                  <img src={joiningRoom.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={40} />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{joiningRoom.title}</h3>
              <p className="text-sm text-gray-500 mb-6 px-4">
                {joiningRoom.description || '이 채팅방에 참여하여 대화를 나눠보세요.'}
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">현재 인원</span>
                  <span className="text-sm font-bold text-zinc-900">{joiningRoom.participantCount || 0}명</span>
                </div>
                <div className="w-[1px] h-8 bg-zinc-100" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">방 유형</span>
                  <span className="text-sm font-bold text-zinc-900">{joiningRoom.type === 'GROUP' ? '그룹' : '1:1'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setJoiningRoom(null);
                  }}
                  className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-2xl transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={confirmJoinRoom}
                  className="flex-1 py-4 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg shadow-zinc-200 transition-all"
                >
                  입장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 6. 퇴장 확인 커스텀 모달 */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl mx-auto mb-6 flex items-center justify-center text-red-500 shadow-inner">
                <LogOut size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">채팅방 나가기</h3>
              <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">
                정말 이 채팅방을 떠나시겠습니까?<br />
                <span className="font-bold text-red-500">퇴장 후에는 기존 대화 내역을 볼 수 없으며, 목록에서 삭제됩니다.</span>
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setLeaveModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-2xl transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={confirmLeaveRoom}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all"
                >
                  방 나가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
