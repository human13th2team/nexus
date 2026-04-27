package com.team.nexus.domain.worker.service;

import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.team.nexus.domain.worker.dto.LaborContractRequestDto;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@Service
public class LaborContractService {

    private PdfFont getFont() throws Exception {
        return PdfFontFactory.createFont("HYGoThic-Medium", "UniKS-UCS2-H", PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
    }

    private String getTemplatePath(String contractType) {
        return switch (contractType) {
            case "NO_PERIOD" -> "/templates/pdf/표준근로계약서_기간없음.pdf";
            case "PERIOD" -> "/templates/pdf/표준근로계약서_기간있음.pdf";
            case "MINOR" -> "/templates/pdf/표준근로계약서_연소근로자.pdf";
            case "PART_TIME" -> "/templates/pdf/표준근로계약서_단시간.pdf";
            case "CONSTRUCTION" -> "/templates/pdf/표준근로계약서_건설일용.pdf";
            default -> throw new IllegalArgumentException("잘못된 계약서 유형: " + contractType);
        };
    }

    public byte[] generateContract(LaborContractRequestDto request) throws Exception {
        String templatePath = getTemplatePath(request.getContractType());
        InputStream templateStream = getClass().getResourceAsStream(templatePath);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfReader reader = new PdfReader(templateStream);
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(reader, writer);
        Document document = new Document(pdfDoc);

        PdfFont font = getFont();
        PdfCanvas canvas = new PdfCanvas(pdfDoc.getFirstPage());
        //To Do: 현재 좌표로 설정되어있어서 뷰단 만들어지면 확인할것
        // 사업주명
        writeText(canvas, font, request.getEmployerName(), 130, 748, 10);
        // 근로자명
        writeText(canvas, font, request.getWorkerName(), 330, 748, 10);
        // 근로개시일
        writeText(canvas, font, request.getStartDate(), 150, 720, 10);
        //종료일
        if ("PERIOD".equals(request.getContractType()) && request.getEndDate() != null) {
            writeText(canvas, font, request.getEndDate(), 310, 720, 10);
        }
        // 근무장소
        writeText(canvas, font, request.getWorkplace(), 150, 700, 10);
        // 업무내용
        writeText(canvas, font, request.getJobDescription(), 150, 682, 10);
        // 소정근로시간
        writeText(canvas, font, request.getWorkStartTime(), 155, 664, 10);
        writeText(canvas, font, request.getWorkEndTime(), 210, 664, 10);
        writeText(canvas, font, request.getBreakStartTime(), 280, 664, 10);
        writeText(canvas, font, request.getBreakEndTime(), 330, 664, 10);
        // 임금
        writeText(canvas, font, request.getWage(), 200, 600, 10);
        // 임금지급일
        writeText(canvas, font, request.getPaymentDay(), 250, 560, 10);
        // 작성일
        writeText(canvas, font, request.getContractDate(), 230, 120, 10);
        // 사업주 정보
        writeText(canvas, font, request.getEmployerName(), 180, 100, 10);
        writeText(canvas, font, request.getEmployerPhone(), 350, 100, 10);
        writeText(canvas, font, request.getEmployerAddress(), 180, 85, 10);
        writeText(canvas, font, request.getRepresentativeName(), 180, 70, 10);
        // 근로자 정보
        writeText(canvas, font, request.getWorkerAddress(), 180, 50, 10);
        writeText(canvas, font, request.getWorkerPhone(), 180, 38, 10);
        writeText(canvas, font, request.getWorkerName(), 180, 26, 10);

        canvas.release();
        document.close();

        return outputStream.toByteArray();
    }

    private void writeText(PdfCanvas canvas, PdfFont font, String text, float x, float y, float fontSize) {
        if (text == null) return;
        canvas.beginText()
                .setFontAndSize(font, fontSize)
                .moveText(x, y)
                .showText(text)
                .endText();
    }
}