/* ============================================================
   PINYIN — tách âm tiết, nhận ra thanh điệu, tô màu theo thanh.
   Ví dụ (chỉ là chữ Latinh): "nǐhǎo" -> [nǐ (thanh 3), hǎo (thanh 3)]
   File này KHÔNG chứa từ vựng; chỉ có quy tắc ghép vần pinyin.
   ============================================================ */
const Pinyin = (() => {
  // Nguyên âm có dấu -> [nguyên âm gốc, số thanh]
  const DAU_THANH = {
    'ā':['a',1],'á':['a',2],'ǎ':['a',3],'à':['a',4],
    'ē':['e',1],'é':['e',2],'ě':['e',3],'è':['e',4],
    'ī':['i',1],'í':['i',2],'ǐ':['i',3],'ì':['i',4],
    'ō':['o',1],'ó':['o',2],'ǒ':['o',3],'ò':['o',4],
    'ū':['u',1],'ú':['u',2],'ǔ':['u',3],'ù':['u',4],
    'ǖ':['v',1],'ǘ':['v',2],'ǚ':['v',3],'ǜ':['v',4],'ü':['v',0]
  };

  // Một âm tiết hợp lệ = (phụ âm đầu) + vần (+ r cuối khi đọc uốn lưỡi)
  // "v" thay cho "ü" để dễ so khớp.
  const PHU_AM_DAU = '(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?';
  const VAN = '(?:iang|iong|uang|ang|eng|ing|ong|iao|ian|uai|uan|van|ai|ei|ui|ao|ou|iu|ie|ve|ue|er|an|en|in|un|vn|ia|ua|uo|io|a|o|e|i|u|v)';
  const AM_TIET_HOP_LE = new RegExp('^' + PHU_AM_DAU + VAN + 'r?$');

  // Các ký tự được coi là "chữ" trong pinyin
  const LA_CHU = /[a-zA-Züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

  /** Bỏ dấu, viết thường: "Nǐ" -> "ni"; "lǚ" -> "lv" */
  function boDau(chu) {
    let kq = '';
    for (const c of chu.normalize('NFC').toLowerCase()) kq += DAU_THANH[c] ? DAU_THANH[c][0] : c;
    return kq;
  }

  /** Thanh của một âm tiết: 1–4, hoặc 0 = thanh nhẹ (không dấu) */
  function layThanh(amTiet) {
    for (const c of amTiet.normalize('NFC').toLowerCase()) {
      if (DAU_THANH[c] && DAU_THANH[c][1]) return DAU_THANH[c][1];
    }
    return 0;
  }

  /**
   * Tách một cụm chữ liền (vd "kèqi") thành các âm tiết.
   * Quy tắc: âm tiết sau không được bắt đầu bằng a/o/e
   * (nếu có, pinyin chuẩn phải viết dấu ' ngăn cách).
   * soMongMuon: nếu biết số chữ Hán thì ưu tiên cách tách có đúng số âm tiết đó.
   */
  function tachCum(cum, soMongMuon) {
    const goc = boDau(cum);
    const cacCach = [];

    // Thử mọi cách tách (từ dài tới ngắn), tối đa 20 cách
    function thu(viTri, daTach) {
      if (cacCach.length >= 20) return;
      if (viTri === goc.length) { cacCach.push(daTach.slice()); return; }
      for (let dai = Math.min(7, goc.length - viTri); dai >= 1; dai--) {
        const doan = goc.slice(viTri, viTri + dai);
        if (!AM_TIET_HOP_LE.test(doan)) continue;
        const tiepTheo = goc[viTri + dai];
        if (tiepTheo && 'aoe'.includes(tiepTheo)) continue; // vi phạm quy tắc dấu '
        daTach.push([viTri, viTri + dai]);
        thu(viTri + dai, daTach);
        daTach.pop();
      }
    }
    thu(0, []);

    if (!cacCach.length) return [cum]; // không tách được -> giữ nguyên cả cụm
    let chon = cacCach.find(c => c.length === soMongMuon);
    if (!chon) chon = cacCach.reduce((a, b) => (b.length < a.length ? b : a)); // ít âm tiết nhất
    const chuGoc = [...cum.normalize('NFC')];
    return chon.map(([dau, cuoi]) => chuGoc.slice(dau, cuoi).join(''));
  }

  /**
   * Tách cả chuỗi pinyin thành danh sách phần:
   *  { chu: "nǐ", thanh: 3 }  -> âm tiết
   *  { chu: ", " }            -> dấu câu, khoảng trắng (không có thanh)
   * soChuHan: số chữ Hán của từ (để tách chính xác hơn), có thể bỏ trống.
   */
  function tach(chuoi, soChuHan) {
    const ketQua = [];
    const chu = [...(chuoi || '').normalize('NFC')];
    // Gom thành các cụm: cụm chữ liền nhau / cụm ký tự khác
    const cum = [];
    for (const c of chu) {
      const laChu = LA_CHU.test(c);
      const cuoi = cum[cum.length - 1];
      if (cuoi && cuoi.laChu === laChu) cuoi.noiDung += c;
      else cum.push({ laChu, noiDung: c });
    }
    const soCumChu = cum.filter(c => c.laChu).length;
    cum.forEach(c => {
      if (!c.laChu) { ketQua.push({ chu: c.noiDung }); return; }
      // Chỉ dùng "số chữ Hán" khi toàn bộ pinyin là một cụm liền
      const mongMuon = soCumChu === 1 ? soChuHan : undefined;
      tachCum(c.noiDung, mongMuon).forEach(a => ketQua.push({ chu: a, thanh: layThanh(a) }));
    });
    return ketQua;
  }

  /** Thoát ký tự đặc biệt HTML */
  function thoat(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Trả về HTML pinyin đã tô màu theo thanh: <span class="t3">nǐ</span>... */
  function toMau(chuoi, soChuHan) {
    return tach(chuoi, soChuHan)
      .map(p => (p.thanh === undefined ? thoat(p.chu) : `<span class="t${p.thanh}">${thoat(p.chu)}</span>`))
      .join('');
  }

  /** Đếm số chữ Hán trong một chuỗi (bỏ qua dấu câu, chữ số...) */
  function demChuHan(chuoi) {
    return ((chuoi || '').match(/\p{Script=Han}/gu) || []).length;
  }

  /** Tên thanh để hiển thị */
  function tenThanh(so) { return so === 0 ? 'thanh nhẹ' : `thanh ${so}`; }

  return { tach, toMau, layThanh, boDau, demChuHan, tenThanh, thoat };
})();
