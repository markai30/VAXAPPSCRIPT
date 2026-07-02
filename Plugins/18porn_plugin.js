// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

/**
 * Định nghĩa thông tin cơ bản của Plugin.
 * Ứng dụng Android sẽ gọi hàm này để đăng ký plugin vào hệ thống.
 */
BaseURL = "https://www.18porn.sex";
function getManifest() {
 return JSON.stringify({
  "id": "18porn", // Định danh duy nhất của plugin
  "name": "18Porn", // Tên hiển thị trong ứng dụng
  "version": "1.0", // Phiên bản hiện tại
  "baseUrl": BaseURL, // URL gốc của nguồn API
  "iconUrl": "https://www.18porn.sex/images/logo.png", // Icon của plugin
  "isEnabled": true, // Trạng thái kích hoạt
  "type": "MOVIE", // Loại nội dung (Phim ảnh)
  "playerType": "auto"
 });
}

/**
 * Định nghĩa các mục (Sections) sẽ hiển thị ở màn hình trang chủ (Home).
 * - type 'Horizontal': Danh sách trượt ngang (gợi ý, phim hot...)
 * - type 'Grid': Hiển thị dạng lưới ô vuông (danh sách đầy đủ)
 */
function getHomeSections() {
 return JSON.stringify([
  { slug: 'new', title: 'Hàng Mới', type: 'Grid' }
 ]);
}

/**
 * Danh mục chính khi người dùng bấm vào tab "Khám phá" hoặc "Thể loại".
 */
function getPrimaryCategories() {
 return JSON.stringify([
  { name: 'Vú Bự', slug: 'categories/big-tits/' },
  { name: 'Xinh Đẹp', slug: 'categories/beuatiful/' },
  { name: 'Châu Á', slug: 'categories/asian/' },
  { name: 'Chơi 3', slug: 'categories/threesome/' },
  { name: 'Lỗ Nhị', slug: 'categories/anal/' }
 ]);
}

/**
 * Cấu hình các tiêu chí sắp xếp phim trong bộ lọc (Filter).
 */
function getFilterConfig() {
 return JSON.stringify({
  sort: [
   { name: 'Thời gian cập nhật', value: 'modified.time' },
   { name: 'Năm phát hành', value: 'year' },
   { name: 'Theo ID', value: '_id' }
  ]
 });
}

// =============================================================================
// URL GENERATION
// =============================================================================

/**
 * Xây dựng URL để lấy danh sách phim dựa theo danh mục (slug) và bộ lọc (filtersJson).
 */
function getUrlList(slug, filtersJson) {
    try {
     var filters = JSON.parse(filtersJson || "{}");
     var page = filters.page || 1;
     
     if (page > 1) {
      return BaseURL + "/" + slug + "/" + page;
     }
     return BaseURL + "/" + slug;
    } catch (e) {
     return BaseURL + "/" + slug;
    }
}

/**
 * Xây dựng URL tìm kiếm phim theo từ khóa.
 */
function getUrlSearch(keyword, filtersJson) {
    // encodeURIComponent giúp mã hóa các ký tự tiếng Việt/ký tự đặc biệt trong từ khóa
    return BaseURL + "search/MOM/" + encodeURIComponent(keyword);
}

/**
 * URL lấy thông tin chi tiết của một bộ phim (tập phim, mô tả, diễn viên...) dựa vào slug phim.
 */
function getUrlDetail(slug) {
    return BaseURL + "/" + slug;
}

// Các hàm lấy danh sách động cho bộ lọc (Thể loại, Quốc gia, Năm)
function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }

function getUrlYears() {
    // API nguồn không hỗ trợ endpoint lấy toàn bộ danh sách năm phát hành.
    // Trả về chuỗi rỗng để Android tự render một danh sách tĩnh (Hardcoded) từ năm 1970 - nay.
    return "";
}

// =============================================================================
// PARSERS
// =============================================================================

/**
 * Phân tích chuỗi JSON phản hồi của danh sách phim (hoặc danh mục)class="list-videos"
 */
function parseListResponse(html) {
 try {
  var items = [];
  var pattern = /(?=<div[^>]*class="[^"]*item[^"]*")/g;
  var splitItems = html.split(pattern).filter(Boolean);
  for (var j = 1; j < splitItems.length; j++) {
   var block = splitItems[j];
   // /ttt/click?url=https://www.18porn.sex/movies/1656206/desi-couple-villagedesicouple-joins-wife-for-hardcore-deepthroat-and-facefuck-action-at-midnight/
   
   var hrefMatch = block.match(/href="([^"]+)"/i);
   if (!hrefMatch) continue;
   
   var id = hrefMatch[1].trim().replace("/ttt/click?url=","");
   var title = "";
   
   var altMatch = block.match(/title="([^"]+)"/i);
   if (altMatch) {
    title = altMatch[1].trim();
   } else {
    var labelMatch = block.match(/alt="([^"]+)"/i); // ĐÃ SỬA: Fallback sang aria-label thay vì trùng lặp quét title
    title = labelMatch ? labelMatch[1].trim() : "";
   }
   
   if (!title || title === "Video không tiêu đề") {
    continue;
   }
   
   var srcMatch = block.match(/data-src="([^"]+)"/i);
   var posterUrl = srcMatch ? srcMatch[1].trim() : "https://ic-vt-nss.cdnsolutions.media/a/YjgwNDg0MGRkZWVjZjQ1ZGVhZjc5MzQ0ZWJkMDlhOTA/s(w:1280,h:720),webp/026/522/500/1280x720.17475568.jpg";
   
   items.push({
    "id": id,
    "title": title,
    "posterUrl": posterUrl,
    "backdropUrl": posterUrl
   });
  }
  
  // html ở đây chính là biến chứa chuỗi HTML phân trang của bạn
  let htmlSource = html;
  
  // 1. Tìm trang hiện tại (Bắt cụm số trong page-current)
  let currentRegex = /class="page-current"[^>]*>\s*<span>\s*(\d+)/i;
  let currentMatch = htmlSource.match(currentRegex);
  let currentPage = currentMatch ? currentMatch[1] : 1;
  currentPage = currentPage.replace(/^0/,"");
  
  // 2. Tìm trang cuối (Bắt số trang từ thuộc tính href của class last)
  let lastRegex = /class="last"[^>]*>\s*<a\s+href="[^"]*\/(\d+)\/"/i;
  let lastMatch = htmlSource.match(lastRegex);
  let lastPage = lastMatch ? lastMatch[1] : 1;
  lastPage = lastPage.replace(/^0/,"");
  // In kết quả ra ô Console của Lab
  console.log("Trang hiện tại là: " + currentPage);
  console.log("Trang cuối cùng là: " + lastPage);
  
  // Trả về object chứa danh sách phim và thông tin phân trang chuẩn hóa
  return JSON.stringify({
   items: items,
   pagination: {
    currentPage: currentPage || 1,
    totalPages: lastPage || 1,
    totalItems: splitItems.length * lastPage,
    itemsPerPage: splitItems.length
   }
  });
 } catch (error) {
  // Nếu lỗi (Ví dụ dữ liệu trống), trả về mảng rỗng để app không bị crash
  return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
 }
}

/**
 * Kết quả tìm kiếm có cấu trúc giống hệt danh sách phim nên tái sử dụng lại hàm parseListResponse.
 */
function parseSearchResponse(html) {
 return parseListResponse(html);
}

/**
 * Phân tích dữ liệu chi tiết của 1 bộ phim: thông tin mô tả và danh sách tập phim (Link phát).
 */
function parseMovieDetail(html) { // Thêm baseUrl vào tham số để tránh lỗi biến toàn cục
 var limg = "";
 var lname = "Đang cập nhật...";
 var ldes = "Không có mô tả.";
 var year = 2026;
 var direc = "????";
 var cast = "????";
 var status = "????";
 var duration = "1:09:00 | 16 | 16";
 var servers = [];
 var categories = "????";
 
 try {
  // 1. Parse các thông tin cơ bản bằng Regex
  let rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (rmatch && rmatch[1]) { limg = rmatch[1]; }
  
  rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (rmatch && rmatch[1]) { lname = rmatch[1]; }
  
  rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
  
  rmatch = html.match(/class="item"[\s\S]*?Models:([\s\S]*?)<\/div>/i);
  if (rmatch && rmatch[1]) { cast = rmatch[1].trim().replace(/<[^>]*>|\r|Models:/g, "").replace(/\n+/g, ", "); }
  
  rmatch = html.match(/Duration:[\s\S]*?em>([\s\S]*?)<\/em>/i);
  if (rmatch && rmatch[1]) { duration = rmatch[1].trim().replace("min", "phút").replace("sec", "giây"); }
  var elink = "";
  var dlink = "";
  rmatch = html.match(/video_id[\s\S]*?\'(\d+)\'/);
  if (rmatch && rmatch[1]) { 
   idvideo = rmatch[1].trim();
   elink = BaseUrl + "/embed/" + idvideo;
  }
  
  rmatch = html.match(/video_url:\s*['"](https:\/\/[^'"]+)['"]/i);
  if (rmatch && rmatch[1]) { 
   dlink = rmatch[1].trim(); 
  }
  
  servers = [{
    name: "Server",
     episodes: [
      [{ id: dlink, name: "Server 1", slug: "tap-1" }],
      [{ id: elink, name: "Server 2", slug: "tap-2" }]
     ]
  }];
  // Luôn trả về dữ liệu JSON (kể cả khi không lấy được link server, các thông tin text vẫn có)
  return JSON.stringify({
   id: dlink || "",
   title: lname,
   originName: lname || "",
   posterUrl: limg,
   backdropUrl: limg,
   description: ldes,
   year: year || 0,
   quality: "HD",
   duration: duration || "",
   servers: servers,
   category: categories,
   director: direc,
   casts: cast,
   status: status || ""
  });
  
 } catch (error) {
  console.error("Lỗi tổng thể của hàm parse:", error);
  return "null";
 }
}

/**
 * Hàm phân tích cấu hình bổ sung khi chuẩn bị phát (Stream).
 * Thường dùng để gán thêm HTTP Headers (như User-Agent, Referer chống chặn link) hoặc nhúng phụ đề rời (.srt, .vtt).
 */
function parseDetailResponse(html) {
 return JSON.stringify({
  url: "", // Ở kiến trúc này, ID của tập phim đã là URL stream (link_m3u8), nên có thể để trống ở đây.
  headers: { "User-Agent": "Mozilla/5.0", "Referer": BaseUrl }, // Ép header để vượt qua cơ chế bảo vệ của server phim
  subtitles: [] // Nguồn phim này nhúng sub sẵn vào luồng video nên không cần phụ đề rời
 });
}

/**
 * Phân tích danh sách thể loại từ API đưa vào bộ lọc động của App
 */
function parseCategoriesResponse(html) {
 try {
  // 1. Chuyển đổi chuỗi JSON thành Object
  const formattedCategories = [
  {
    name: "Điện Thoại & Máy Tính Bảng",
    slug: "dien-thoai-may-tinh-bang"
  },
  {
    name: "Laptop & Thiết Bị IT",
    slug: "laptop-thiet-bi-it"
  },
  {
    name: "Thời Trang Nam",
    slug: "thoi-trang-nam"
  }
];
  
  // 4. Trả về chuỗi JSON kết quả
  return JSON.stringify(formattedCategories);
  
 } catch (error) {
  // Trả về mảng rỗng dạng chuỗi nếu JSON bị lỗi hoặc parse thất bại
  return "[]";
 }
}


// KHỚP MẪU ROPHIMFAKE: Trả về chuỗi text thuần túy thay vì gọi JSON.stringify
function parseCountriesResponse(html) { return "[]"}
function parseYearsResponse(html) { return "[]"}
