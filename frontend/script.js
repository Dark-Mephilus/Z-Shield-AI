//Z Shield AI (JavaScript Part)
// Program by Zidaan
document.addEventListener('DOMContentLoaded', () => {
    // PDF.js Worker Setup
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
    // Cache the UI elements once so the handlers can update the page without repeated lookups.
    // DOM Elements
    const elements = {
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        documentInput: document.getElementById('documentInput'),
        charCount: document.getElementById('charCount'),
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        fileInfo: document.getElementById('fileInfo'),
        fileName: document.getElementById('fileName'),
        fileMeta: document.getElementById('fileMeta'),
        fileIcon: document.getElementById('fileIcon'),
        removeFileBtn: document.getElementById('removeFileBtn'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        btnText: document.querySelector('.btn-text-main'),
        loader: document.querySelector('.loader'),
        statusMessage: document.getElementById('statusMessage'),
        resultsDashboard: document.getElementById('resultsDashboard'),
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        exportPdfBtn: document.getElementById('exportPdfBtn'),
        // Chat elements
        chatSection: document.getElementById('chatSection'),
        chatBox: document.getElementById('chatBox'),
        chatInput: document.getElementById('chatInput'),
        sendChatBtn: document.getElementById('sendChatBtn'),
        // Live Web Verification elements
        webVerificationPanel: document.getElementById('webVerificationPanel'),
        webVerificationStatus: document.getElementById('webVerificationStatus'),
        webVerificationBadge: document.getElementById('webVerificationBadge'),
        webTargetsChecked: document.getElementById('webTargetsChecked'),
        webSourceCount: document.getElementById('webSourceCount'),
        webAssessmentStatus: document.getElementById('webAssessmentStatus'),
        webSearchCoverage: document.getElementById('webSearchCoverage'),
        webEvidenceCoverage: document.getElementById('webEvidenceCoverage'),
        webFindings: document.getElementById('webFindings'),
        webSources: document.getElementById('webSources')
    };
    // Keep the current input, selected image, extracted document context, and local scan history.
    // State Variables
    let currentInputData = "";
    let extractedDocumentContext = ""; 
    let currentImageFile = null; 
    let scanHistory = JSON.parse(localStorage.getItem('zShieldHistory')) || [];
    // Use same-origin requests when deployed; local development points to the FastAPI server.
    // Backend API Endpoints
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const API_BASE = isLocal ? "http://127.0.0.1:8000" : "";
    const BACKEND_URL = `${API_BASE}/api/analyze`;
    const CHAT_URL = `${API_BASE}/api/chat`;
    // Tab Switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Content`).classList.add('active');
        });
    });
    // Input Character Count
    elements.documentInput.addEventListener('input', (e) => {
        elements.charCount.textContent = `${e.target.value.length.toLocaleString()} characters`;
        currentInputData = e.target.value;
    });
    // Drag and Drop Handlers
    elements.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); });
    elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('dragover'));
    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); elements.dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
    });
    // File Input Change Handler
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) processFile(e.target.files[0]);
    });
    // File Processing
    elements.removeFileBtn.addEventListener('click', () => {
        elements.fileInput.value = ""; 
        currentInputData = "";
        currentImageFile = null;
        elements.fileInfo.classList.add('hidden'); 
        elements.dropZone.style.display = "block";
    });
    // Button Event Listeners
    elements.analyzeBtn.addEventListener('click', generateReport);
    elements.exportPdfBtn.addEventListener('click', exportToPDF);
    elements.clearHistoryBtn.addEventListener('click', () => {
        scanHistory = []; localStorage.removeItem('zShieldHistory'); renderHistory();
    });
    // Chat Event Listeners
    elements.sendChatBtn.addEventListener('click', handleChat);
    elements.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });
    // Method for File Processing
    // Detect image vs. text document and extract text in the browser where possible.
    async function processFile(file) {
        showStatus("Processing file...", "info");
        elements.dropZone.style.display = "none"; 
        elements.fileInfo.classList.remove('hidden');
        elements.fileName.textContent = file.name;
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        // Handle image files separately
        if (file.type.startsWith('image/')) {
            if(elements.fileIcon) elements.fileIcon.textContent = "🖼️";
            currentImageFile = file;
            currentInputData = ""; 
            elements.fileMeta.textContent = `Size: ${fileSizeMB} MB | Optimized Upload Active`;
            elements.statusMessage.classList.add('hidden');
            return;
        }
        // Handle text-based files (PDF, DOCX, TXT)
        if(elements.fileIcon) elements.fileIcon.textContent = "📄";
        currentImageFile = null;
        // Try catch block to handle file reading and extraction
        try {
            let extractedText = "";
            if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
                extractedText = await extractTextFromPDF(file);
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith('.docx')) {
                extractedText = await extractTextFromDOCX(file);
            } else {
                extractedText = await file.text();
            }
            // Update the current input data and display metadata
            currentInputData = extractedText;
            const wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
            elements.fileMeta.textContent = `Size: ${fileSizeMB} MB | Extracted Words: ${wordCount.toLocaleString()}`;
            elements.statusMessage.classList.add('hidden');
        } catch (error) {
            showStatus(`Error reading file: ${error.message}`, "error");
            elements.removeFileBtn.click();
        }
    }
    // Method for PDF Text Extraction using PDF.js
    // Extract selectable PDF text with PDF.js; scanned PDFs may require OCR, which is not included here.
    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + "\n";
        }
        return text;
    }
    // Method for DOCX Text Extraction using Mammoth.js
    // Convert DOCX content to plain text with Mammoth before sending it for analysis.
    async function extractTextFromDOCX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }
    // Method for Analysis Execution
    // Validate the current input, show progress, request analysis, then render and save the report.
    async function generateReport() {
        const textToAnalyze = currentInputData.trim() || elements.documentInput.value.trim();
        // Check if both text and image are missing
        if (!textToAnalyze && !currentImageFile) {
            showStatus("Please provide text or an image for analysis.", "error"); return;
        }
        // Set the extracted document context for chat reference
        extractedDocumentContext = textToAnalyze;
        setLoadingState(true);
        elements.statusMessage.classList.add('hidden');
        elements.resultsDashboard.classList.add('hidden');
        elements.chatSection.classList.add('hidden');
        // Try catch block for backend API call
        try {
            const analysisResult = await callBackendAPI(textToAnalyze, currentImageFile);
            displayResults(analysisResult);
            saveToHistory(analysisResult, textToAnalyze || "Secure Image Upload");
        } catch (error) {
            showStatus(error.message, "error");
        } finally {
            setLoadingState(false);
        }
    }
    // Method to Call Backend API with FormData for efficiency and security
    // Send text and optional image as multipart form data; API keys remain on the backend.
    async function callBackendAPI(content, imageFile) {
        const formData = new FormData();
        if (content) formData.append("content", content);
        if (imageFile) formData.append("image", imageFile);
        // Additional data can be added 
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData 
        });
        // Check for response status and handle errors
        if (!response.ok) {
            let message = `Server request failed (${response.status}).`;
            try {
                const err = await response.json();
                message = err.detail || message;
            } catch (_) {
                try {
                    const text = await response.text();
                    if (text) message = text.slice(0, 300);
                } catch (_) {}
            }
            throw new Error(message);
        }
        return await response.json();
    }
    // Method to Display Live Web Verification
    // Render search coverage, evidence assessment, and source links returned by the backend.
    // Coverage measures search completion, not whether a claim is true.
    function displayWebVerification(data) {
        const verification = data.webVerification || {};
        const assessment = data.webVerificationAssessment || {};
        const results = Array.isArray(verification.results) ? verification.results : [];

        if (!elements.webVerificationPanel) return;

        const sourceItems = [];
        results.forEach(item => {
            (Array.isArray(item.sources) ? item.sources : []).forEach(source => {
                sourceItems.push({
                    ...source,
                    query: item.query,
                    type: item.type
                });
            });
        });

        elements.webTargetsChecked.textContent = verification.targetsChecked || 0;
        elements.webSourceCount.textContent = sourceItems.length;
        elements.webAssessmentStatus.textContent = assessment.status || "Inconclusive";
        if (elements.webSearchCoverage) elements.webSearchCoverage.textContent = `${verification.searchCoveragePercent || 0}%`;
        if (elements.webEvidenceCoverage) elements.webEvidenceCoverage.textContent = `${verification.evidenceCoveragePercent || 0}%`;
        elements.webVerificationStatus.textContent =
            verification.status || "Web verification was not requested.";

        const status = assessment.status || "Inconclusive";
        elements.webVerificationBadge.textContent =
            verification.enabled === false ? "Not Configured" : status;

        elements.webFindings.textContent = "";
        const findings = Array.isArray(assessment.findings) ? assessment.findings : [];
        if (findings.length) {
            findings.slice(0, 4).forEach(finding => {
                const div = document.createElement("div");
                div.className = "web-finding";
                div.textContent = finding;
                elements.webFindings.appendChild(div);
            });
        } else {
            const div = document.createElement("div");
            div.className = "web-finding";
            div.textContent = assessment.recommendedAction ||
                "No conclusive web evidence was available. Verify important claims through official sources.";
            elements.webFindings.appendChild(div);
        }

        elements.webSources.textContent = "";
        sourceItems.slice(0, 8).forEach(source => {
            if (!source.link) return;
            let url;
            try {
                url = new URL(source.link);
                if (!["http:", "https:"].includes(url.protocol)) return;
            } catch (_) {
                return;
            }

            const anchor = document.createElement("a");
            anchor.className = "web-source";
            anchor.href = url.href;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";

            const title = document.createElement("div");
            title.className = "web-source-title";
            title.textContent = source.title || "Web source";

            const meta = document.createElement("div");
            meta.className = "web-source-meta";
            const tier = source.credibilityTier ? ` • Source tier: ${source.credibilityTier}` : "";
            meta.textContent = `${source.source || url.hostname} • ${source.type || "general"} • ${source.query || ""}${tier}`;

            const snippet = document.createElement("div");
            snippet.className = "web-source-snippet";
            snippet.textContent = source.snippet || "No snippet available.";

            anchor.append(title, meta, snippet);
            elements.webSources.appendChild(anchor);
        });
    }

    // Method to Display Analysis Results
    // Populate the risk dashboard from Gemini's structured response, with safe fallbacks for missing fields.
    function displayResults(data) {
        elements.resultsDashboard.classList.remove('hidden');
        displayWebVerification(data);
        elements.chatSection.classList.remove('hidden');
        // Update Gauges with dynamic colors based on scores
        updateGauge('safetyGauge', 'safetyScoreValue', data.safetyScore, 10, determineSafetyColor(data.safetyScore));
        updateGauge('trustGauge', 'trustScoreValue', data.trustScore, 100, data.trustScore > 70 ? 'var(--success-green)' : (data.trustScore > 40 ? 'var(--warning-orange)' : 'var(--danger-red)'));
        updateGauge('scamGauge', 'scamScoreValue', data.scamProbability, 100, data.scamProbability > 60 ? 'var(--danger-red)' : (data.scamProbability > 20 ? 'var(--warning-orange)' : 'var(--success-green)'));
        // Update Timeline Indicator Position
        const timelineIndicator = document.getElementById('timelineIndicator');
        timelineIndicator.style.left = `${Math.min(100, Math.max(0, data.scamProbability))}%`;
        // Update Labels based on scores and insights
        document.getElementById('safetyCategory').textContent = determineSafetyLabel(data.safetyScore);
        if(data.trustInsights) {
            document.getElementById('riskCategoryLabel').textContent = data.trustInsights.riskCategory || "Unknown";
            document.getElementById('missingInfoCount').textContent = data.trustInsights.missingInformationCount || "0";
            document.getElementById('verificationDiff').textContent = data.trustInsights.verificationDifficulty || "N/A";
            populateList('scamFactorsList', data.trustInsights.scamFactors, "No high-risk scam indicators found.");
        }
        // Update Summary and Intent Section
        document.getElementById('summaryText').textContent = data.summary;
        document.getElementById('intentBadge').textContent = `Intent: ${data.detectedIntent}`;
        document.getElementById('confidenceBadge').textContent = `AI Confidence: ${data.confidenceLevel}/10`;
        document.getElementById('plainEnglishText').textContent = data.plainEnglishExplanation;
        // Update Lists based on analysis results
        populateList('redFlagsList', data.redFlags, "No critical red flags detected.");
        populateList('silentFlagsList', data.silentRedFlags, "No missing information detected.");
        populateList('psychTacticsList', data.psychologicalTactics, "No obvious psychological manipulation detected.");
        // Check if action advice is available
        if (data.actionAdvice) {
            populateList('immediateActionsList', data.actionAdvice.immediateActions, "No immediate actions required.");
            populateList('smartQuestionsList', data.actionAdvice.smartQuestions, "No specific questions needed.");
            populateList('safeAlternativesList', data.actionAdvice.safeAlternatives, "No specific alternatives suggested.");
        }
        populateList('factCheckList', data.factCheckRecommendations, "Standard verification applies.");
        // Update Contract Analysis Section
        const contractGrid = document.getElementById('contractGrid');
        contractGrid.innerHTML = '';
        // Check if contract analysis data is available and populate the section
        if (data.contractAnalysis && data.contractAnalysis.length > 0) {
            document.getElementById('contractSection').classList.remove('hidden');
            // Fill each clause card with relevant data
            data.contractAnalysis.forEach(clause => {
                const card = document.createElement('div');
                card.className = 'clause-card';
                card.innerHTML = `
                    <div class="clause-header">
                        <span class="font-bold">${clause.clauseNumber}</span>
                        <span class="clause-risk risk-${clause.riskLevel}">${clause.riskLevel} Risk</span>
                    </div>
                    <div class="font-bold mb-1">${clause.clauseSummary}</div>
                    <p class="clause-desc">${clause.explanation}</p>
                    <p class="clause-rec">💡 ${clause.recommendation}</p>
                `;
                contractGrid.appendChild(card);
            });
        } else {
            document.getElementById('contractSection').classList.add('hidden');
        }
        elements.resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Method to Handle Chat Functionality with AI
    // Send a follow-up question together with the current report/document context.
    async function handleChat() {
        const question = elements.chatInput.value.trim();
        if (!question) return;
        // Display the user's question in the chat box
        appendChatMessage(question, "user-msg");
        elements.chatInput.value = "";
        const loadingId = "loader-" + Date.now();
        appendChatMessage("...", "ai-msg", loadingId);
        elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
        // Try catch block for chat API call
        try {
            const formData = new FormData();
            formData.append("question", question);
            if (extractedDocumentContext) formData.append("context", extractedDocumentContext);
            if (currentImageFile) formData.append("image", currentImageFile);
            // Call the backend chat API
            const response = await fetch(CHAT_URL, {
                method: "POST",
                body: formData
            });
            // Check for response status and handle errors
            if (!response.ok) {
                let message = `Chat request failed (${response.status}).`;
                try {
                    const err = await response.json();
                    message = err.detail || message;
                } catch (_) {
                    try {
                        const text = await response.text();
                        if (text) message = text.slice(0, 300);
                    } catch (_) {}
                }
                throw new Error(message);
            }
            // Append the response to the chat box
            const data = await response.json();
            document.getElementById(loadingId).remove();
            appendChatMessage(data.answer, "ai-msg");
        } catch (error) {
            document.getElementById(loadingId).remove();
            appendChatMessage(`Error: ${error.message}`, "ai-msg");
        }
        elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
    }
    // Method to Append Chat Messages to the Chat Box
    function appendChatMessage(text, className, id = null) {
        const div = document.createElement('div');
        div.className = `chat-msg ${className}`;
        div.textContent = text;
        if(id) div.id = id;
        elements.chatBox.appendChild(div);
    }
    // Method to generate and download a clean, high-quality intelligence report PDF.
    // Uses the dedicated forensic print area when present, with the live dashboard as fallback.
    window.downloadPdfReport = async function (scanHash = 'ZShield') {
        const element = document.getElementById('forensicReportPrintArea') ||
                        document.getElementById('resultsDashboard');
        const exportButton = document.getElementById('exportPdfBtn');

        // A report must exist and be visible before attempting export.
        if (!element || element.classList.contains('hidden') || !element.innerText.trim()) {
            showStatus('Please analyze a document first, then export the report.', 'error');
            return;
        }

        // Keep the simple browser print option as a fallback if html2pdf failed to load.
        if (typeof window.html2pdf !== 'function') {
            window.print();
            return;
        }

        const originalLabel = exportButton ? exportButton.textContent : '';
        if (exportButton) {
            exportButton.disabled = true;
            exportButton.textContent = 'Preparing PDF…';
        }

        // Apply print styling to the real visible report. Avoid off-screen clones, which can
        // inherit hidden/animated styles and result in blank html2canvas captures.
        element.classList.add('pdf-export-mode');
        const previousBackground = element.style.backgroundColor;
        const previousColor = element.style.color;
        // Match the app's dark dashboard while the PDF canvas is being captured.
        element.style.backgroundColor = '#0a0e17';
        element.style.color = 'var(--text-main)';

        try {
            // Wait for fonts and layout to settle before html2canvas captures the report.
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const safeHash = String(scanHash || 'ZShield').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'ZShield';
            const options = {
                margin: [8, 8, 10, 8],
                filename: `Z-ID_Shield_Report_${safeHash}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2.5,
                    backgroundColor: '#0a0e17',
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: Math.max(document.documentElement.clientWidth, 900)
                },
                pagebreak: {
                    mode: ['css', 'legacy'],
                    avoid: ['.glass-panel', '.score-card', '.content-card', '.clause-card', '.web-source']
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
            };

            await window.html2pdf().set(options).from(element).save();
            showStatus('Your high-quality PDF report has been exported.', 'success');
        } catch (error) {
            console.error('PDF export failed:', error);
            showStatus('PDF export failed. Please try again or use Print / Save as PDF.', 'error');
        } finally {
            element.classList.remove('pdf-export-mode');
            element.style.backgroundColor = previousBackground;
            element.style.color = previousColor;
            if (exportButton) {
                exportButton.disabled = false;
                exportButton.textContent = originalLabel || 'Export to PDF';
            }
        }
    };

    // Keep the existing Export to PDF button connected to the new report exporter.
    async function exportToPDF() {
        const scanHash = (typeof currentScanHash !== 'undefined' && currentScanHash) ? currentScanHash : 'ZShield';
        await window.downloadPdfReport(scanHash);
    }
    // Method to Update Gauge Elements Dynamically
    function updateGauge(elementId, valueId, value, max, color) {
        const gauge = document.getElementById(elementId);
        const valSpan = document.getElementById(valueId);
        // Use a timeout to ensure the CSS variables are updated after the DOM has rendered
        setTimeout(() => {
            const percentage = (value / max) * 100;
            gauge.style.setProperty('--percentage', `${percentage}%`);
            gauge.style.setProperty('--score-color', color);
            valSpan.textContent = value;
        }, 100);
    }
    // Method to Populate Lists Dynamically with Fallback for Empty Arrays
    function populateList(elementId, itemsArray, emptyMessage) {
        const listEl = document.getElementById(elementId);
        listEl.innerHTML = '';
        // Check if the items array is empty and display a fallback message
        if (!itemsArray || itemsArray.length === 0) {
            listEl.innerHTML = `<li>${emptyMessage}</li>`; return;
        }
        itemsArray.forEach(item => {
            const li = document.createElement('li'); li.textContent = item; listEl.appendChild(li);
        });
    }
    // Method to Set Loading State for the Analyze Button and Loader
    function setLoadingState(isLoading) {
        elements.analyzeBtn.disabled = isLoading;
        if (isLoading) {
            elements.btnText.textContent = "Running Analysis..."; elements.loader.classList.remove('hidden');
        } else {
            elements.btnText.textContent = "Analyze Risk Profile"; elements.loader.classList.add('hidden');
        }
    }
    // Method to Show Status Messages with Dynamic Styling
    function showStatus(message, type) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status-message ${type === 'error' ? 'status-error' : ''}`;
        elements.statusMessage.classList.remove('hidden');
        if (type !== 'error') setTimeout(() => elements.statusMessage.classList.add('hidden'), 5000);
    }
    // Methods to Determine Safety Color and Label Based on Score
    function determineSafetyColor(score) {
        if (score >= 8) return 'var(--success-green)'; if (score >= 5) return 'var(--warning-orange)'; return 'var(--danger-red)';
    }
    function determineSafetyLabel(score) {
        if (score >= 9) return 'Highly Safe'; if (score >= 7) return 'Mostly Safe'; if (score >= 4) return 'Risky'; return 'Highly Unsafe';
    }
    // Method to Save Scan Results to History
    // Store a compact scan record in browser localStorage for this device only.
    function saveToHistory(result, text) {
        const titleText = text === "Secure Image Upload" ? text : text.substring(0, 30).replace(/\n/g, ' ') + '...';
        const record = { id: Date.now(), date: new Date().toLocaleDateString(), title: titleText, score: result.safetyScore, data: result };
        scanHistory.unshift(record);
        if (scanHistory.length > 10) scanHistory.pop();
        localStorage.setItem('zShieldHistory', JSON.stringify(scanHistory));
        renderHistory();
    }
    // Method to Render Scan History in the UI
    // Rebuild the scan-history list from locally stored records.
    function renderHistory() {
        elements.historyList.innerHTML = '';
        if (scanHistory.length === 0) {
            elements.historyList.innerHTML = '<li class="empty-history">No past scans found.</li>'; return;
        }
        // Loop through each scan record and create list items with click events to display results
        scanHistory.forEach(scan => {
            const li = document.createElement('li'); li.className = 'history-item';
            const color = determineSafetyColor(scan.score);
            li.innerHTML = `<div><div class="history-title">${scan.title}</div><div class="history-meta">${scan.date}</div></div><div style="color: ${color}; font-weight: bold;">Score: ${scan.score}/10</div>`;
            li.addEventListener('click', () => displayResults(scan.data));
            elements.historyList.appendChild(li);
        });
    }
    renderHistory();
    // Service Worker Registration for PWA functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Z-Shield: ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('Z-Shield: ServiceWorker registration failed: ', err);
                });
        });
    }
});
// End of Program