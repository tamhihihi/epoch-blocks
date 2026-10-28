(() => {
  let installPrompt;
  const button=document.createElement('button');button.id='installGame';button.className='btn ghost';button.textContent='＋ Cài game lên điện thoại';
  document.querySelector('#lobby').appendChild(button);
  if(location.protocol==='file:')button.textContent='Chơi trên điện thoại';
  button.onclick=async()=>{
    if(location.protocol==='file:'){document.querySelector('#dialogContent').innerHTML='<h2>Đây là bản trên máy tính</h2><p>Để chơi trên điện thoại, cần mở đường dẫn bản online đã cập nhật. Đường dẫn file trên máy tính không mở trực tiếp được từ điện thoại.</p>';document.querySelector('#dialog').showModal();return}
    if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return}
    document.querySelector('#dialogContent').innerHTML='<h2>Chơi trên điện thoại</h2><p><b>iPhone:</b> mở link bằng Safari → Chia sẻ → Thêm vào Màn hình chính.</p><p><b>Android:</b> mở link bằng Chrome → menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào màn hình chính.</p><p>Lần đầu cần mạng để tải game và đăng nhập nếu được yêu cầu. Tiến trình được lưu riêng trên mỗi trình duyệt/thiết bị, chưa đồng bộ từ máy tính.</p>';document.querySelector('#dialog').showModal();
  };
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
  window.addEventListener('appinstalled',()=>button.hidden=true);
  if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone)button.hidden=true;
  // Installation is optional. Register only when served, never in a downloaded file.
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
