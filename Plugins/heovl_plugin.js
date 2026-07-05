// =============================================================================
// VAAPP Plugin-Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu:s crophim_plugin.js
// =============================================================================
BaseURL = "https://heovl.im";
function getManifest() {
    return JSON.stringify({
        "id": "heovl",
        "name": "Heovl",
        "description": "XXX Hay",
        "version": "1.5",
        "baseUrl": BaseURL,
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}



// Hàm tách menu bằng list
function buildMenu(listurl){
// 2. Khởi tạo mảng chứa kết quả
let menulist = [];
let regex = /^([^@\r\n]+)@@([^@\r\n]+)(?:@@([^@\r\n]+))?/gm;
let match;

// 4. Vòng lặp duyệt qua từng hàng bằng RegExp
while ((match = regex.exec(listurl)) !== null) {
    let link = match[1].trim();
    let name = match[2].trim();
    let check = match[3] ? match[3].trim() : undefined; // Lấy giá trị check nếu có

    let item = {};

    // 5. Kiểm tra điều kiện biến check để tạo cấu trúc Object
    if (check === "false") {
        item = { 
            "slug": link, 
            "title": name, 
            "type": "Horizontal" 
        };
    } else if (check === "true") {
        item = { 
            "slug": link, 
            "title": name, 
            "type": "Grid" 
        };
    } else {
        // Trường hợp không có biến check (undefined)
        item = { 
            "slug": link, 
            "name": name 
        };
    }

    // 6. Push item vào mảng menulist
    menulist.push(item);
}


// 7. In kết quả ra để kiểm tra
    return menulist
}

//https://pornone.com/newest/
//https://pornone.com/newest/3/
//https://pornone.com/search?q=black
/*
{ "slug": "", "title": "", "type": "Horizontal" },
{ "slug": "", "title": "", "type": "Grid" }
*/

function getHomeSections() {
    var listurl = `
    categories/viet-nam@@Việt Nam@@true
    `
    var  menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

// https://pornone.com/anal/
/*
    { "slug": "", "name": ""},
    { "slug": "", "name": ""}
    
    
*/
function getPrimaryCategories() {
    var listurl = `
    categories/choi-lo-dit-anal-sex@@Lỗ Nhị
    categories/nga-russia@@Nga
    categories/vu-to@@Vú To
    categories/tap-the@@Tập Thể
    categories/hiep-dam@@Hiếp Dâm
    categories/loan-luan@@Loạn Luân
    categories/phim-cap-3@@Phim Cap 3
    `
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilters() {
    return JSON.stringify({
        "sort": [
            { "name": "Mới nhất", "value": "newest" }
        ]
    });
}

// =============================================================================
// URL GENERATION (Bóc tách slug sạch theo khuôn mẫu mới)
// =============================================================================

// https://heovl.im/search/vang-anh?page=3
// https://heovl.im/categories/viet-nam?page=3

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        if (page > 1) {
            if (slug.indexOf("search") > -1) {
                return BaseURL + "/" + slug + "/?page=" + page;
            } else {
                return BaseURL + "/" + slug + "/?page=" + page;
            }
        }
        return BaseURL + "/" + slug;
    } catch (e) {
        return BaseURL + "/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BaseURL + "/search/" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BaseURL + "/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        // Tách từng item phim để tránh regex chạy sai giữa các item
        var chunks = html.split('class="videos__box-wrapper"');
        
        // Bắt đầu từ 1 vì phần tử 0 là phần html trước class đầu tiên
        for (var i = 1; i < chunks.length; i++) {
            var blockHtml = chunks[i];
            
            // Kiểm tra xem block này có chứa các thẻ cốt lõi của video không
            if (!blockHtml.match(/img|href|video|src/i)) {
                continue;
            }
            
            // 1. Lấy link phim (Sửa lỗi logic || thành &&)
            var urlMatch = blockHtml.match(/a[\s\S]*?href="([^"]+)"/i);
            var url = "";
            if (urlMatch && urlMatch[1]) {
                url = urlMatch[1];
            } else {
                // Nếu không có url hợp lệ, bỏ qua chunk này luôn, không lấy rác
                continue;
            }
            
            if (!url.startsWith("http")) {
                url = BASEURL + url;
            }
            
            // 2. Lấy Title
            var title = "";
            var rmatch = blockHtml.match(/title="([^"]+)"/i);
            if (rmatch && rmatch[1]) {
                title = rmatch[1];
            }
            
            // 3. Lấy Poster (Toán tử 3 ngôi chuẩn)
            var posterMatch = blockHtml.match(/data-src="([^"]+)"/i) || blockHtml.match(/src="([^"]+)"/i);
            var poster = posterMatch ? posterMatch[1] : "";
            if (poster && !poster.startsWith("http")) {
                poster = BASEURL + poster;
            }
            
            items.push({
                id: url,
                title: title,
                posterUrl: poster
            });
        }
        
        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 999 }
        });
    } catch (e) {
        console.error("Lỗi Parse:", e);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}


function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var direc = "????";
    var cast = "????";
    var status = "????";
    var duration = "1:09:00 | 16 | 16";
    var servers = [];
    
    try {
        // 1. Parse Meta Tags
        var rmatch;
        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { limg = rmatch[1]; }
        
        rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { lname = rmatch[1]; }
        
        rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
        
        var episodes = [];
        
        // 2. Kiểm tra xem có nút bấm server hay không bằng Regex MatchAll
        // Tìm tất cả các đoạn có data-source="..." trong class button tương ứng
        var serverRegex = /class="[^"]*video-player__cdn-selector-button[^"]*"[^>]*data-source="([^"]+)"/gi;
        var serverMatches = [...html.matchAll(serverRegex)];
        
        if (serverMatches.length > 0) {
            // Nếu tìm thấy các nút server
            for (var j = 0; j < serverMatches.length; j++) {
                var sourceUrl = serverMatches[j][1]; // Lấy giá trị trong nhóm ngoặc đơn ([^"]+)
                
                if (j === 0) { lurl = sourceUrl; } // Server đầu tiên làm ID chính
                
                episodes.push({
                    id: sourceUrl,
                    name: "Server " + (j + 1),
                    slug: "tap-" + (j + 1)
                });
            }
        } else {
            // 3. Nếu không có nút thì tìm iframe
            var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
            var iframeMatch = html.match(iframeRegex);
            
            if (iframeMatch && iframeMatch[1]) {
                lurl = iframeMatch[1];
                episodes.push({
                    id: iframeMatch[1],
                    name: "Server 1",
                    slug: "tap-1"
                });
            }
        }
        
        servers = [{
            name: "Server",
            episodes: episodes
        }];
        
    } catch (e) {
        console.error("Lỗi parse dữ liệu: ", e);
    }
    
    // Trả về kết quả (Dù lỗi hay không lỗi vẫn return đúng cấu trúc object mong muốn)
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: lurl ? ldes + "\r\n\r\n" + lurl : ldes,
        servers: servers,
        quality: "HD",
        year: year,
        status: status,
        duration: duration,
        casts: cast,
        director: direc
    });
}


// =================================================================
// TẦNG 1: Xử lý trang xem phim gốc (link_xem_phim)
// =================================================================
function parseDetailResponse(html, url) {
    try {
        // LỚP 1: Tìm thẻ iframe trong trang xem phim
        // Giả định HTML có dạng: <iframe src="https://gialap.com/embed/123"></iframe>
        var iframeMatch = html.match(/window.videoData\s+=\s+{"id":"(\w+)/i);
        
        if (iframeMatch) {
            //https://wogblex.com/videos/693d47c06b69a605f403d222/config
            var host = "https://wogblex.com";
            var link_json = host + "/videos/" + iframeMatch[1] + "/config";
            
            // 🛑 LỆNH NGỪNG TẦNG 1: 
            // Trả link_iframe về cho App. Nhờ cấu hình "isEmbed: true", App sẽ biết 
            // đây chưa phải là link video cuối và sẽ tự động fetch tiếp link_iframe này, 
            // sau đó ném kết quả vào hàm parseEmbedResponse ở dưới.
            return JSON.stringify({
                url: link_json,
                isEmbed: true,
                headers: { "Referer": host,"Origin": host } // Gửi kèm referer nếu iframe chặn xem lén
            });
        }
        
        // LỚP DỰ PHÒNG: Nếu trang gốc không có iframe mà có sẵn m3u8 luôn
        var m3u8Match = html.match(/(https?:\/\/[^"' ]+\.m3u8[^"' ]*)/i);
        if (m3u8Match) {
            return JSON.stringify({ url: m3u8Match[1], mimeType: "application/x-mpegURL", isEmbed: false });
        }
        return JSON.stringify({ url: url, isEmbed: true });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}


// =================================================================
// TẦNG 2 & TẦNG 3 (Dùng chung một hàm nhưng lặp lại)
// =================================================================
function parseEmbedResponse(html, sourceUrl) {
    try {
        //log("Đang quét mã nguồn tại URL: " + sourceUrl);
        
        // KỊCH BẢN A: Quét tìm xem CÓ iframe con nào bên trong nữa không (Tầng 3)
        var object = JSON.parse(html);
        
        if (object) {
            var linkfile = object.sources[0].file;
            var type = object.sources[0].type;
            return JSON.stringify({ url: linkfile, mimeType: type, isEmbed: false });
        }
        // Phòng hờ tầng cuối cùng không ra m3u8 mà ra link xem trực tiếp dạng khác
        return JSON.stringify({ url: sourceUrl, isEmbed: false });
        
    } catch (e) {
        return JSON.stringify({ url: sourceUrl, isEmbed: false });
    }
}

// KHỚP MẪU ROPHIMFAKE: Trả về chuỗi text thuần túy thay vì gọi JSON.stringify
function parseCategoriesResponse(html) { return "[]"}
function parseCountriesResponse(html) { return "[]"}
function parseYearsResponse(html) { return "[]"}
