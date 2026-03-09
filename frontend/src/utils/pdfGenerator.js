import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateHealthLogPDF = async (logs, patientName = "Patient") => {
    console.log("generateHealthLogPDF: Function called");

    try {
        if (!logs || logs.length === 0) {
            alert("No health logs to export.");
            return;
        }

        const doc = new jsPDF();

        // --- FETCH AND ADD CUSTOM FONT (Malayalam Support) ---
        try {
            console.log("Fetching font...");
            const fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf';
            const response = await fetch(fontUrl);
            if (!response.ok) throw new Error("Failed to fetch font");

            const fontBuffer = await response.arrayBuffer();
            const fontBase64 = arrayBufferToBase64(fontBuffer);

            doc.addFileToVFS('NotoSansMalayalam-Regular.ttf', fontBase64);
            doc.addFont('NotoSansMalayalam-Regular.ttf', 'NotoSansMalayalam', 'normal');
            doc.setFont('NotoSansMalayalam');
            console.log("Font added successfully");
        } catch (fontError) {
            console.warn("Could not load custom font:", fontError);
            alert("Warning: Internet connection needed to load language fonts. PDF may show garbled text.");
        }
        // -----------------------------------------------------

        // Title
        doc.setFontSize(18);
        doc.text(`Health Report: ${patientName}`, 14, 22);

        // Date
        doc.setFontSize(11);
        doc.setTextColor(100);
        const date = new Date().toLocaleDateString();
        doc.text(`Date Generated: ${date}`, 14, 30);

        // Prepare table data
        const tableColumn = ["Date", "Time", "Type", "Details"];
        const tableRows = [];

        logs.forEach((log) => {
            const logDate = new Date(log.timestamp);
            const logData = [
                logDate.toLocaleDateString(),
                logDate.toLocaleTimeString(),
                "Voice Log",
                log.text || ""
            ];
            tableRows.push(logData);
        });

        // Generate table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] },
            styles: {
                fontSize: 10,
                cellPadding: 3,
                font: 'NotoSansMalayalam' // Apply font to table
            },
        });

        const fileName = `Health_Report_${patientName}_${date.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
        console.log(`PDF saved as ${fileName}`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(`Failed to generate PDF. Error: ${error.message}`);
    }
};

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
