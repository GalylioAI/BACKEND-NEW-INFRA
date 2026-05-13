import { getPublicBlogBySlug, getPublicBlogs } from "./api/blogs";
import type { BlogArticle } from "./api/types";
import { articles } from "./articles";

function fallbackBlogs(): BlogArticle[] {
  return articles.map((article) => ({
    slug: article.slug,
    category: article.category,
    categoryColor: article.categoryColor,
    title: article.title,
    desc: article.desc,
    img: article.img,
    read: article.read,
    date: article.date,
    sections: article.sections.map((section) => ({
      type: section.type,
      text: section.text ?? null,
      items: section.items ?? [],
    })),
  }));
}

export async function loadBlogs() {
  try {
    const blogs = await getPublicBlogs();
    if (blogs.length > 0) return blogs;
  } catch {
    // fall back to local articles when the backend is unavailable
  }
  return fallbackBlogs();
}

export async function loadBlogBySlug(slug: string) {
  try {
    return await getPublicBlogBySlug(slug);
  } catch {
    return fallbackBlogs().find((article) => article.slug === slug) || null;
  }
}
