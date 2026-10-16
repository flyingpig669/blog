export const postNavigation = {
  resolve: function(post, services) {
    // 专栏内部上下一篇与章节解析
    var columnInfo = post.column ? services.getColumnById(post.column) : null;
    var colPosts = [];
    var prevPost = null;
    var nextPost = null;
    var prevLabel = '← 上一篇';
    var nextLabel = '下一篇 →';
    var colIndex = -1;

    if (columnInfo && Array.isArray(columnInfo.posts) && columnInfo.posts.length > 0) {
      // 专栏内部定向导航 (严格按章节 order 升序排布)
      colPosts = columnInfo.posts.slice();
      colIndex = colPosts.findIndex(function(p) {
        return (p.id && post.id && p.id === post.id) || p.slug === post.slug;
      });
      if (colIndex !== -1) {
        prevPost = colIndex > 0 ? colPosts[colIndex - 1] : null;
        nextPost = colIndex < colPosts.length - 1 ? colPosts[colIndex + 1] : null;
        if (prevPost) {
          var pOrder = prevPost.order ? (prevPost.order < 10 ? '0' + prevPost.order : prevPost.order) : (colIndex);
          prevLabel = '← 第 ' + pOrder;
        }
        if (nextPost) {
          var nOrder = nextPost.order ? (nextPost.order < 10 ? '0' + nextPost.order : nextPost.order) : (colIndex + 2);
          nextLabel = '第 ' + nOrder + ' →';
        }
      }
    } else {
      // 普通独立博文：按全局发布列表获取前后相邻文章
      var allPosts = services.getPosts({ sort: 'date' }).reverse();
      var currentIndex = allPosts.findIndex(function(p) { return p.slug === post.slug; });
      prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
      nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    }

    var partNumber = post.order ? (post.order < 10 ? '0' + post.order : post.order) : '01';
    var totalParts = colPosts.length || (columnInfo ? columnInfo.postsCount : 1);

    return { columnInfo: columnInfo, colPosts: colPosts, prevPost: prevPost, nextPost: nextPost, prevLabel: prevLabel, nextLabel: nextLabel, colIndex: colIndex, partNumber: partNumber, totalParts: totalParts };
  }
};
