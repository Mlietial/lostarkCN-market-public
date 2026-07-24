(() => {
  let loaderPromise = null;

  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (loaderPromise) return loaderPromise;
    loaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      script.onload = () => window.html2canvas
        ? resolve(window.html2canvas)
        : reject(new Error("截图组件加载失败"));
      script.onerror = () => reject(new Error("截图组件加载失败，请检查网络后重试"));
      document.head.appendChild(script);
    });
    return loaderPromise;
  }

  function showToast(message) {
    let toast = document.querySelector(".share-export-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "share-export-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function safeFilename(value) {
    return String(value || "分享图片")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("图片生成失败")), "image/png");
    });
  }

  function createFooter(title) {
    const footer = document.createElement("footer");
    footer.className = "share-export-footer";
    const source = location.protocol === "file:"
      ? "本地数据页面"
      : `${location.host}${location.pathname}`;
    footer.innerHTML = `<strong>${title}</strong><span>${new Date().toLocaleString("zh-CN")} 生成 · ${source}</span>`;
    return footer;
  }

  async function exportPng(options = {}) {
    const target = typeof options.target === "string"
      ? document.querySelector(options.target)
      : options.target;
    const button = options.button;
    if (!target) {
      showToast("没有找到可导出的内容");
      return;
    }
    const originalText = button?.textContent;
    try {
      if (button) {
        button.disabled = true;
        button.textContent = "正在生成...";
      }
      options.beforeExport?.();
      document.body.classList.add("share-exporting");
      const footer = createFooter(options.title || document.title);
      target.appendChild(footer);
      await document.fonts?.ready;
      await new Promise(resolve => window.setTimeout(resolve, 120));
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(target, {
        backgroundColor: options.backgroundColor || "#f5f8fc",
        scale: options.scale || 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: Math.max(document.documentElement.clientWidth, target.scrollWidth),
        windowHeight: Math.max(document.documentElement.clientHeight, target.scrollHeight)
      });
      const blob = await canvasToBlob(canvas);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `${safeFilename(options.filename || options.title || document.title)}-${date}.png`);
      showToast("分享图已导出，可以直接发送给其他玩家");
      footer.remove();
    } catch (error) {
      console.error(error);
      showToast(error.message || "图片导出失败，请稍后重试");
      document.querySelectorAll(".share-export-footer").forEach(node => node.remove());
    } finally {
      document.body.classList.remove("share-exporting");
      options.afterExport?.();
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  window.LOSTARK_SHARE_EXPORT = { exportPng, showToast };
})();
