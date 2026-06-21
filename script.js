/* ===================================================
   FREELANCE INVOICE BUILDER — Application Logic
   =================================================== */

(function () {
  'use strict';

  // ── DOM References ────────────────────────────────
  const billingTbody  = document.getElementById('billing-tbody');
  const addItemBtn    = document.getElementById('add-item-btn');
  const subtotalEl    = document.getElementById('subtotal');
  const taxRateInput  = document.getElementById('tax-rate');
  const taxAmountEl   = document.getElementById('tax-amount');
  const grandTotalEl  = document.getElementById('grand-total');
  const downloadBtn   = document.getElementById('download-pdf-btn');
  const invoiceDateEl = document.getElementById('invoice-date');

  // ── Set default date to today ─────────────────────
  const today = new Date();
  invoiceDateEl.value = today.toISOString().split('T')[0];

  // ── Currency formatter ────────────────────────────
  const fmt = (n) => '₹' + Number(n).toFixed(2);

  // ── Auto-Resize Logic for Textareas ───────────────
  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto'; 
    textarea.style.height = textarea.scrollHeight + 'px'; 
  }

  // ── Row HTML template ─────────────────────────────
  function createRowHTML() {
    return `
      <td>
        <textarea class="form-input item-name auto-expand" placeholder="Service or product name" aria-label="Item Name" rows="1"></textarea>
      </td>
      <td>
        <input type="number" class="form-input item-qty" min="1" value="1" aria-label="Quantity">
      </td>
      <td>
        <input type="number" class="form-input item-price" min="0" step="0.01" value="0.00" aria-label="Price">
      </td>
      <td>
        <span class="row-total">0.00</span>
      </td>
      <td>
        <button type="button" class="btn-remove" aria-label="Remove item" title="Remove item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </td>`;
  }

  // ── Recalculate a single row ──────────────────────
  function calcRow(row) {
    const qty   = parseFloat(row.querySelector('.item-qty').value)   || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = qty * price;
    row.querySelector('.row-total').textContent = total.toFixed(2);
    return total;
  }

  // ── Recalculate all totals ────────────────────────
  function recalcAll() {
    let subtotal = 0;
    billingTbody.querySelectorAll('.billing-row').forEach((row) => {
      subtotal += calcRow(row);
    });

    const taxRate   = parseFloat(taxRateInput.value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    subtotalEl.textContent   = fmt(subtotal);
    taxAmountEl.textContent  = fmt(taxAmount);
    grandTotalEl.textContent = fmt(grandTotal);
  }

  // ── Bind input listeners to a row ─────────────────
  function bindRowEvents(row) {
    const inputs = row.querySelectorAll('.item-qty, .item-price');
    inputs.forEach((input) => {
      input.addEventListener('input', recalcAll);
    });

    const nameInput = row.querySelector('.item-name.auto-expand');
    if (nameInput) {
      nameInput.addEventListener('input', function() {
        autoResizeTextarea(this);
      });
    }

    const removeBtn = row.querySelector('.btn-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        row.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        setTimeout(() => {
          row.remove();
          recalcAll();
        }, 250);
      });
    }
  }

  // ── Initialize existing rows ──────────────────────
  billingTbody.querySelectorAll('.billing-row').forEach(bindRowEvents);

  const projectDesc = document.getElementById('project-description');
  if (projectDesc) {
    projectDesc.addEventListener('input', function() {
      autoResizeTextarea(this);
    });
  }

  // ── Add New Item ──────────────────────────────────
  addItemBtn.addEventListener('click', () => {
    const row = document.createElement('tr');
    row.className = 'billing-row row-enter';
    row.innerHTML = createRowHTML();
    billingTbody.appendChild(row);
    bindRowEvents(row);

    row.querySelector('.item-name').focus();
    row.addEventListener('animationend', () => {
      row.classList.remove('row-enter');
    }, { once: true });
  });

  // ── Tax rate change ───────────────────────────────
  taxRateInput.addEventListener('input', recalcAll);
  recalcAll();

  // ── PDF Download (NO FLASH, GHOST CLONE METHOD) ───────────────────
  downloadBtn.addEventListener('click', () => {
    
    // Change button text to indicate active processing
    const originalBtnText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = 'Generating PDF...';
    downloadBtn.style.pointerEvents = 'none';
    downloadBtn.style.opacity = '0.8';

    const clientName = document.getElementById('client-name').value.trim();
    const dateVal    = invoiceDateEl.value || 'invoice';
    const filename   = clientName
      ? `Invoice_${clientName.replace(/\s+/g, '_')}_${dateVal}.pdf`
      : `Invoice_${dateVal}.pdf`;

    const element = document.querySelector('.main-content');
    
    // GHOST CLONE METHOD: No classes are added to the live screen, nor are inputs modified.
    // Everything is handled in the background during the HTML2Canvas 'onclone' process.
    const options = {
      margin:      15, // 15mm exact margins
      filename:    filename,
      image:       { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, 
        scrollY: 0,
        onclone: function(clonedDoc) {
          // Add the .pdf-mode class strictly to the cloned document, not the live screen
          clonedDoc.body.classList.add('pdf-mode');

          // Swap input fields with standard div elements in the cloned document
          const clonedFormElements = clonedDoc.querySelectorAll('.main-content input:not([type="hidden"]), .main-content textarea');
          const liveFormElements = document.querySelectorAll('.main-content input:not([type="hidden"]), .main-content textarea');

          clonedFormElements.forEach((el, index) => {
            const liveEl = liveFormElements[index];
            const div = clonedDoc.createElement('div');
            
            div.style.minHeight = liveEl.offsetHeight + 'px';
            div.style.padding = '12px 16px'; 
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.style.color = '#0f172a';
            
            const compStyles = window.getComputedStyle(liveEl);
            div.style.fontSize = compStyles.fontSize;
            div.style.fontWeight = compStyles.fontWeight;
            div.style.fontFamily = compStyles.fontFamily;
            div.style.border = '1px solid transparent'; 
            
            div.textContent = liveEl.value || '';

            if (el.classList.contains('item-qty') || el.classList.contains('item-price') || el.classList.contains('tax-input')) {
              div.style.textAlign = 'right';
            }

            el.parentNode.insertBefore(div, el);
            el.style.display = 'none'; // Hide the original input in the clone
          });
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };

    html2pdf()
      .set(options)
      .from(element)
      .save()
      .then(() => {
        // Reset button state on success
        downloadBtn.innerHTML = originalBtnText;
        downloadBtn.style.pointerEvents = 'auto';
        downloadBtn.style.opacity = '1';
      })
      .catch((err) => {
        console.error("PDF generation failed:", err);
        // Reset button state on failure
        downloadBtn.innerHTML = originalBtnText;
        downloadBtn.style.pointerEvents = 'auto';
        downloadBtn.style.opacity = '1';
      });
  });
})();