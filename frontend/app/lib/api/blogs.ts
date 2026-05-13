import { apiFetch } from "./client";
import type { BlogArticle, BlogArticlePayload } from "./types";

export function getPublicBlogs() {
  return apiFetch<BlogArticle[]>("/api/v1/blogs", {
    cache: "no-store",
  });
}

export function getPublicBlogBySlug(slug: string) {
  return apiFetch<BlogArticle>(`/api/v1/blogs/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
}

export function getAdminBlogs(token: string) {
  return apiFetch<BlogArticle[]>("/api/v1/admin/blogs", {
    token,
    cache: "no-store",
  });
}

export function createAdminBlog(token: string, payload: BlogArticlePayload) {
  return apiFetch<BlogArticle>("/api/v1/admin/blogs", {
    method: "POST",
    token,
    body: payload,
  });
}

export function deleteAdminBlog(token: string, blogId: string) {
  return apiFetch<{ message?: string }>(`/api/v1/admin/blogs/${encodeURIComponent(blogId)}`, {
    method: "DELETE",
    token,
  });
}
