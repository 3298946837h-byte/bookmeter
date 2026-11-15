import JSZip from 'jszip';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate standard EPUB 2.0 file in pure browser memory
 * Can be opened in Apple Books, WeChat Read, Kindle, Moon+ Reader, Calibre
 */
export async function generateBookEpub(book) {
  const zip = new JSZip();

  // 1. mimetype (MUST be first file, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF').file('container.xml', containerXml);

  // 3. OEBPS content
  const oebps = zip.folder('OEBPS');

  const title = escapeXml(book.title || '未知书名');
  const author = escapeXml(book.author || '未知作者');
  const publisher = escapeXml(book.publisher || 'BookMeter 全网书评');
  const year = escapeXml(String(book.publicationYear || '2024'));
  const category = escapeXml(book.category || '通识');
  const summary = escapeXml(book.summary || '暂无简介');
  const bookId = `bookmeter-${book.id || Date.now()}`;

  // Content OPF
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>zh-CN</dc:language>
    <dc:identifier id="BookId">urn:uuid:${bookId}</dc:identifier>
    <dc:publisher>${publisher}</dc:publisher>
    <dc:date>${year}</dc:date>
    <dc:subject>${category}</dc:subject>
    <dc:description>${summary}</dc:description>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="stylesheet" href="style.css" media-type="text/css"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
  </spine>
</package>`;
  oebps.file('content.opf', contentOpf);

  // TOC NCX
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>${title} - 全书精读与全网对冲导读</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // Style CSS
  const styleCss = `body { font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; line-height: 1.8; color: #1e293b; padding: 1.5em; }
h1 { font-size: 1.8em; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 0.3em; margin-bottom: 0.4em; }
h2 { font-size: 1.3em; color: #0369a1; margin-top: 1.5em; border-left: 4px solid #0284c7; padding-left: 0.5em; }
p { margin: 0.8em 0; text-align: justify; }
.meta { color: #64748b; font-size: 0.9em; margin-bottom: 1.5em; background: #f8fafc; padding: 0.8em; border-radius: 6px; }
.score-badge { display: inline-block; background: #0284c7; color: white; padding: 0.2em 0.6em; border-radius: 4px; font-weight: bold; }
ul { padding-left: 1.5em; }
li { margin: 0.4em 0; }
blockquote { margin: 1.2em 0; padding: 0.8em 1.2em; background: #f1f5f9; border-left: 4px solid #64748b; font-style: italic; }
`;
  oebps.file('style.css', styleCss);

  // Chapter 1 XHTML
  const prosHtml = (book.pros || []).map(p => `<li>${escapeXml(p)}</li>`).join('');
  const consHtml = (book.cons || []).map(c => `<li>${escapeXml(c)}</li>`).join('');
  const pRatings = book.platformRatings || {};
  const doubanScore = pRatings.douban?.score ?? '暂无';
  const goodreadsScore = pRatings.goodreads?.score ? `${pRatings.goodreads.score} 星` : '暂无';
  const amazonScore = pRatings.amazon?.score ? `${pRatings.amazon.score} 星` : '暂无';
  const googleScore = pRatings.googleBooks?.score ? `${pRatings.googleBooks.score} 星` : '暂无';

  const chapter1Html = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <link rel="stylesheet" href="style.css" type="text/css"/>
</head>
<body>
  <h1>《${title}》</h1>
  ${book.originalTitle ? `<p><em>原著名：${escapeXml(book.originalTitle)}</em></p>` : ''}
  
  <div class="meta">
    <p><strong>作　者：</strong>${author} ${book.translator ? ` | <strong>译者：</strong>${escapeXml(book.translator)}` : ''}</p>
    <p><strong>分　类：</strong>${category} | <strong>出版年份：</strong>${year} | <strong>出版社：</strong>${publisher}</p>
    <p><strong>综合评分：</strong><span class="score-badge">${book.compositeScore || '8.5'} / 10</span> (${escapeXml(book.verdict?.label || '推荐')})</p>
  </div>

  <h2>一、 内容提要与全书大纲</h2>
  <p>${summary}</p>

  <h2>二、 全网四大权威平台口碑数据</h2>
  <ul>
    <li><strong>豆瓣读书：</strong>${doubanScore} 分 ${pRatings.douban?.ratingCount ? `(${pRatings.douban.ratingCount.toLocaleString()} 人评价)` : ''}</li>
    <li><strong>Goodreads：</strong>${goodreadsScore} ${pRatings.goodreads?.ratingCount ? `(${pRatings.goodreads.ratingCount.toLocaleString()} 人参评)` : ''}</li>
    <li><strong>Amazon 购书验证评分：</strong>${amazonScore}</li>
    <li><strong>Google Books：</strong>${googleScore}</li>
  </ul>

  <h2>三、 为什么说它是好书 (读者好评亮点)</h2>
  <ul>${prosHtml || '<li>全网高分好评，思想内涵深刻，值得反复品读。</li>'}</ul>

  <h2>四、 为什么有人打差评 (劝退警告与阅读门槛)</h2>
  <ul>${consHtml || '<li>阅读需一定沉浸门槛与思考。</li>'}</ul>

  ${book.representativeReview ? `<h2>五、 读者代表性高赞热评</h2><blockquote>“${escapeXml(book.representativeReview)}”</blockquote>` : ''}

  <h2>六、 离线阅读备忘</h2>
  <p>本书由 BookMeter 全网书评与电子书下载中心打包生成。您可以在手机阅读器中随时翻阅此书的核心梗概、论证框架与权威对冲口碑。</p>
</body>
</html>`;
  oebps.file('chapter1.xhtml', chapter1Html);

  // Generate blob
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}
