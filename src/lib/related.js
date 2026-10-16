export function relatedPosts(post, posts, limit=3) {
  const tags=new Set(post.tags || []);
  return posts.filter(candidate=>candidate.slug!==post.slug && !(post.column && candidate.column===post.column))
    .map(candidate=>({post:candidate,score:(candidate.tags || []).filter(tag=>tags.has(tag)).length}))
    .filter(item=>item.score>0).sort((a,b)=>b.score-a.score || String(b.post.date).localeCompare(String(a.post.date)) || a.post.slug.localeCompare(b.post.slug))
    .slice(0,limit).map(item=>item.post);
}
