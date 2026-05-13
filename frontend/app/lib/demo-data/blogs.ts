import { articles } from "../articles";
import { demoAsync, nowIso } from "./async";
import { readJson, writeJson } from "./storage";
import type { BlogArticle, BlogArticlePayload } from "./types";

const BLOGS_KEY = "1111.demo.blogs";

function articleSeed(): BlogArticle[] {
  return articles.map((article, index) => ({
    _id: `blog-${index + 1}`,
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
    created_at: nowIso(),
    updated_at: nowIso(),
  }));
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `article-${Date.now()}`
  );
}

function readBlogs() {
  return readJson<BlogArticle[]>(BLOGS_KEY, articleSeed());
}

function writeBlogs(blogs: BlogArticle[]) {
  writeJson(BLOGS_KEY, blogs);
}

export function getPublicBlogs() {
  return demoAsync(readBlogs());
}

export function getPublicBlogBySlug(slug: string) {
  const blog = readBlogs().find((article) => article.slug === slug);
  if (!blog)
    return Promise.reject(new Error("Article not found in demo content."));
  return demoAsync(blog);
}

export function getAdminBlogs() {
  return getPublicBlogs();
}

export function createAdminBlog(payload: BlogArticlePayload) {
  const blogs = readBlogs();
  const slug = payload.slug?.trim() || slugify(payload.title);
  const blog: BlogArticle = {
    _id: `blog-${slug}-${Date.now()}`,
    slug,
    category: payload.category,
    categoryColor: payload.categoryColor,
    title: payload.title,
    desc: payload.desc,
    img: payload.img,
    read: payload.read,
    date: payload.date,
    sections: payload.sections,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const next = [blog, ...blogs.filter((article) => article.slug !== slug)];
  writeBlogs(next);
  return demoAsync(blog);
}

export function deleteAdminBlog(blogId: string) {
  const blogs = readBlogs();
  writeBlogs(
    blogs.filter((blog) => blog._id !== blogId && blog.slug !== blogId),
  );
  return demoAsync({ message: "Demo article deleted." });
}
