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
  MessageSquare
} from 'lucide-react';
import ChatService from '@/lib/chat/chatService';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  message: string;
  timestamp: string;
  type: 'TALK' | 'ENTER' | 'LEAVE';
}

interface ChatRoom {
  id: string;
  title: string;
  description?: string;
  lastMessage?: string;
  unreadCount?: number;
  type: 'GROUP' | 'PRIVATE';
  participantCount?: number;
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

  const handleJoinRoom = async (roomId: string) => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`http://localhost:8080/api/v1/chat/rooms/${roomId}/join?userId=${currentUserId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchMyRooms(currentUserId);
        setActiveRoomId(roomId);
        setShowAllRooms(false);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
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
        setMessages(prev => [...prev, message]);
        scrollToBottom();
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
        setNewRoomType('GROUP');
      }
    } catch (error) {
      alert("방 생성에 실패했습니다.");
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
                  handleJoinRoom(room.id);
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
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                room.type === 'GROUP' ? 'bg-zinc-900' : 'bg-zinc-400'
              }`}>
                {room.type === 'GROUP' ? <Hash size={20} /> : room.title[0]}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm truncate max-w-[120px]">{room.title}</span>
                  {showAllRooms && !rooms.some(r => r.id === room.id) && (
                    <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-md font-bold">JOIN</span>
                  )}
                  {!showAllRooms && room.unreadCount ? (
                    <div className="w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {room.unreadCount}
                    </div>
                  ) : null}
                </div>
                <p className="text-[11px] text-zinc-400 truncate max-w-[180px] mt-0.5 font-medium">
                  {room.description || (showAllRooms ? '대화에 참여해보세요' : (room.lastMessage || '새로운 대화를 시작해보세요'))}
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
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-bold text-zinc-500">
                  {activeRoom.type === 'GROUP' ? <Hash size={20} /> : <Users size={20} />}
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
                <button className="p-2.5 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-xl transition-all"><Info size={20} /></button>
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
                    <div className={`max-w-[70%] group relative px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                      isMe 
                      ? 'bg-black text-white rounded-tr-none shadow-xl shadow-black/10' 
                      : 'bg-white text-zinc-800 rounded-tl-none shadow-lg shadow-black/5 border border-zinc-100'
                    }`}>
                      {msg.message}
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
                className="relative bg-zinc-50 rounded-2xl border border-zinc-100 p-2 focus-within:bg-white focus-within:border-black transition-all"
              >
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full pl-4 pr-16 py-3 bg-transparent border-none focus:ring-0 text-sm resize-none font-medium placeholder:text-zinc-400"
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
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors">
                  <Paperclip size={14} /> 파일 첨부
                </button>
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors">
                  <Smile size={14} /> 이모지
                </button>
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors">
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
    </div>
  );
};

export default ChatComponent;
