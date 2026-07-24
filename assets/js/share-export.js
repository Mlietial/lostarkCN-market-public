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

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("图片读取失败"));
      reader.readAsDataURL(blob);
    });
  }

  async function prepareImagesForExport(target) {
    const records = [...target.querySelectorAll("img")].map(image => ({
      image,
      src: image.getAttribute("src"),
      srcset: image.getAttribute("srcset"),
      visibility: image.style.visibility
    }));
    await Promise.all(records.map(async record => {
      const { image } = record;
      const source = image.currentSrc || image.src;
      if (!source || source.startsWith("data:") || source.startsWith("blob:")) return;
      try {
        const response = await fetch(source, {
          mode: "cors",
          credentials: new URL(source, location.href).origin === location.origin ? "same-origin" : "omit",
          cache: "force-cache"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        image.removeAttribute("srcset");
        image.src = await blobToDataUrl(await response.blob());
        await image.decode?.();
      } catch (error) {
        console.warn("导出时跳过无法安全读取的图片：", source, error);
        image.style.visibility = "hidden";
      }
    }));
    return () => records.forEach(({ image, src, srcset, visibility }) => {
      if (src === null) image.removeAttribute("src");
      else image.setAttribute("src", src);
      if (srcset === null) image.removeAttribute("srcset");
      else image.setAttribute("srcset", srcset);
      image.style.visibility = visibility;
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
    let restoreImages = () => {};
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
      restoreImages = await prepareImagesForExport(target);
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
    } catch (error) {
      console.error(error);
      const message = /tainted|toBlob/i.test(String(error?.message))
        ? "图片资源受到浏览器安全限制，已停止导出"
        : error.message || "图片导出失败，请稍后重试";
      showToast(message);
    } finally {
      restoreImages();
      document.querySelectorAll(".share-export-footer").forEach(node => node.remove());
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
