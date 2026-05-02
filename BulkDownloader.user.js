// ==UserScript==
// @name         Hello IITK bulk lectures downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Downloads all lecture PDFs
// @author       aayush01x
// @license      MIT
// @match        https://hello.iitk.ac.in/*
// @grant        GM_download
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        #bulk-download-btn {
            position: fixed; top: 80px; right: 20px; z-index: 99999;
            padding: 12px 20px; background-color: #004fbd; color: white;
            border: none; border-radius: 8px; font-weight: bold; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        #bulk-download-btn:disabled { background-color: #ccc; cursor: not-allowed; }
    `);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const sanitizeName = (name) => {
        return name.replace(/[<>:"/\\|?*]/g, '').trim().replace(/\s+/g, '_');
    };

    const createButton = () => {
        const btnExists = document.getElementById('bulk-download-btn');
        const isLecturePage = window.location.href.endsWith('lectures');
        if (!isLecturePage) {
            if (btnExists) btnExists.remove();
            return;
        }
        if (btnExists) return;
        const btn = document.createElement('button');
        btn.id = 'bulk-download-btn';
        btn.innerHTML = 'Download All Lectures';
        document.body.appendChild(btn);

        btn.onclick = async () => {
            btn.disabled = true;
            const collapsedButtons = document.querySelectorAll('.accordion-button.collapsed');
            collapsedButtons.forEach(b => b.click());
            await sleep(1000);
            const lectureRows = document.querySelectorAll('li.list-group-item');
            if (lectureRows.length === 0) {
                alert("No lecture rows found!");
                btn.disabled = false;
                return;
            }

            for (let i = 0; i < lectureRows.length; i++) {
                const row = lectureRows[i];
                const titleSpan = row.querySelector('span.text-dark-text');
                const fileIcon = row.querySelector('i.ph-files');
                if (!fileIcon || !titleSpan) continue;
                const fileIndex = (i + 1).toString().padStart(2, '0');
                const lectureName = sanitizeName(titleSpan.innerText);
                const finalFileName = `${fileIndex}_${lectureName}.pdf`;
                btn.innerHTML = `Downloading ${fileIndex}: ${lectureName}...`;
                fileIcon.click();
                let link = null;
                let attempts = 0;
                while (!link && attempts < 10) {
                    await sleep(600);
                    link = document.querySelector('.modal.show .modal-body a[href*=".pdf"]');
                    attempts++;
                }
                if (link) {
                    const url = link.href;
                    GM_download({
                        url: url,
                        name: finalFileName,
                        saveAs: false,
                        onerror: (err) => console.error("Download failed:", err)
                    });
                    const closeBtn = document.querySelector('.modal.show .btn-close');
                    if (closeBtn) closeBtn.click();
                    await sleep(800);
                }
            }

            btn.innerHTML = 'All Finished';
            btn.disabled = false;
            setTimeout(() => { if (document.getElementById('bulk-download-btn')) btn.innerHTML = 'Download All Lectures'; }, 5000);
        };
    };
    setInterval(createButton, 2000);
})();
