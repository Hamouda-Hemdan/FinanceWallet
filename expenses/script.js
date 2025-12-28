document.addEventListener("DOMContentLoaded", () => {
  const receiptFileInput = document.getElementById("receipt-file");
  
  if (receiptFileInput) {
    receiptFileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          document.getElementById("expense-form").setAttribute("data-receipt", event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  document.addEventListener("click", function(e) {
    if (e.target.closest(".expense-item")) {
      const expenseItem = e.target.closest(".expense-item");
      const receiptData = expenseItem.getAttribute("data-receipt");
      
      if (receiptData) {
        const modal = document.createElement("div");
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        `;
        
        const img = document.createElement("img");
        img.src = receiptData;
        img.style.cssText = `
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        `;
        
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "×";
        closeBtn.style.cssText = `
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 24px;
          cursor: pointer;
          color: #333;
        `;
        
        modal.appendChild(img);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        modal.addEventListener("click", function() {
          document.body.removeChild(modal);
        });
        
        img.addEventListener("click", function(e) {
          e.stopPropagation();
        });
      }
    }
  });
});