package com.smartcampus.operationshub.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class QrCodeService {

    private static final int DEFAULT_SIZE = 256;

    public String generateSvg(String content) {
        try {
            BitMatrix matrix = new QRCodeWriter()
                    .encode(
                            content,
                            BarcodeFormat.QR_CODE,
                            DEFAULT_SIZE,
                            DEFAULT_SIZE,
                            Map.of(EncodeHintType.MARGIN, 1));
            return toSvg(matrix);
        } catch (WriterException exception) {
            throw new IllegalStateException("Unable to generate QR code", exception);
        }
    }

    private String toSvg(BitMatrix matrix) {
        StringBuilder svg = new StringBuilder();
        svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ")
                .append(matrix.getWidth())
                .append(' ')
                .append(matrix.getHeight())
                .append("\" shape-rendering=\"crispEdges\">")
                .append("<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>");

        for (int y = 0; y < matrix.getHeight(); y += 1) {
            for (int x = 0; x < matrix.getWidth(); x += 1) {
                if (matrix.get(x, y)) {
                    svg.append("<rect x=\"")
                            .append(x)
                            .append("\" y=\"")
                            .append(y)
                            .append("\" width=\"1\" height=\"1\" fill=\"#0f172a\"/>");
                }
            }
        }

        svg.append("</svg>");
        return svg.toString();
    }
}
