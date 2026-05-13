"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  createAdminBlog,
  deleteAdminBlog,
  getAdminBlogs,
} from "@/lib/demo-data/blogs";
import type {
  BlogArticle,
  BlogArticlePayload,
  BlogSection,
  BlogSectionType,
} from "@/lib/demo-data/types";

type EditableSection = {
  id: string;
  type: BlogSectionType;
  text: string;
  itemsText: string;
};

const sectionTypes: BlogSectionType[] = ["p", "h2", "h3", "ul", "highlight"];

function createSection(type: BlogSectionType = "p"): EditableSection {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    text: "",
    itemsText: "",
  };
}

export default function DashboardBlogsPage() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Blog");
  const [categoryColor, setCategoryColor] = useState("#3BDEB9");
  const [desc, setDesc] = useState("");
  const [read, setRead] = useState("5 min");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
  );
  const [img, setImg] = useState("");
  const [sections, setSections] = useState<EditableSection[]>([
    createSection("p"),
    createSection("h2"),
    createSection("p"),
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getAdminBlogs()
      .then((items) => {
        if (!active) return;
        setBlogs(items);
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Impossible de charger les blogs",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const imagePreview = useMemo(() => img || null, [img]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setCategory("Blog");
    setCategoryColor("#3BDEB9");
    setDesc("");
    setRead("5 min");
    setDate(
      new Date().toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      }),
    );
    setImg("");
    setSections([createSection("p"), createSection("h2"), createSection("p")]);
  };

  const handleImageImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImg(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSection = (id: string, next: Partial<EditableSection>) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, ...next } : section,
      ),
    );
  };

  const handleCreateBlog = async () => {
    const normalizedSections: BlogSection[] = sections
      .map((section) => ({
        type: section.type,
        text: section.text.trim() || undefined,
        items:
          section.type === "ul"
            ? section.itemsText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
      }))
      .filter((section) =>
        section.type === "ul"
          ? (section.items?.length || 0) > 0
          : Boolean(section.text),
      );

    if (
      !title.trim() ||
      !desc.trim() ||
      !img.trim() ||
      normalizedSections.length === 0
    ) {
      setError("Titre, description, image et contenu sont obligatoires.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: BlogArticlePayload = {
        slug: slug.trim() || undefined,
        category: category.trim(),
        categoryColor: categoryColor.trim(),
        title: title.trim(),
        desc: desc.trim(),
        img: img.trim(),
        read: read.trim(),
        date: date.trim(),
        sections: normalizedSections,
      };

      const savedBlog = await createAdminBlog(payload);
      setBlogs((current) => [
        savedBlog,
        ...current.filter((item) => item.slug !== savedBlog.slug),
      ]);
      setSuccess("Le nouveau blog est en ligne sur la partie client.");
      resetForm();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Impossible de creer le blog",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteAdminBlog(blogId);
      setBlogs((current) => current.filter((blog) => blog._id !== blogId));
      setSuccess("Le blog a ete supprime.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer ce blog",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-8">
      <DashboardHeader title="Blogs" />

      <main className="dashboard-main space-y-6">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Nouveau blog</h3>
              <p className="dashboard-card-subtitle">
                Publiez un nouvel article client depuis le dashboard superadmin.
              </p>
            </div>
          </div>

          <div className="dashboard-card-body space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Titre du blog"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                  <input
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="slug-optionnel"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Categorie"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                  <input
                    value={categoryColor}
                    onChange={(event) => setCategoryColor(event.target.value)}
                    placeholder="#3BDEB9"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                  <input
                    value={read}
                    onChange={(event) => setRead(event.target.value)}
                    placeholder="5 min"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                </div>

                <input
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  placeholder="Mai 2026"
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                />
                <textarea
                  value={desc}
                  onChange={(event) => setDesc(event.target.value)}
                  placeholder="Description courte du blog"
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                />

                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
                      <ImagePlus className="size-4" />
                      Importer une image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageImport}
                        className="hidden"
                      />
                    </label>
                    <input
                      value={img.startsWith("data:") ? "" : img}
                      onChange={(event) => setImg(event.target.value)}
                      placeholder="Ou collez une URL d'image"
                      className="h-11 min-w-[260px] flex-1 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">
                      Contenu du blog
                    </h4>
                    <button
                      onClick={() =>
                        setSections((current) => [
                          ...current,
                          createSection("p"),
                        ])
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-purple/40"
                    >
                      <Plus className="size-4" />
                      Ajouter une section
                    </button>
                  </div>

                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="space-y-3 rounded-2xl border border-border bg-background p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Section {index + 1}
                        </div>
                        <button
                          onClick={() =>
                            setSections((current) =>
                              current.filter((item) => item.id !== section.id),
                            )
                          }
                          className="rounded-full border border-border p-2 text-muted-foreground hover:border-red-500/40 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <select
                        value={section.type}
                        onChange={(event) =>
                          updateSection(section.id, {
                            type: event.target.value as BlogSectionType,
                            text: "",
                            itemsText: "",
                          })
                        }
                        className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                      >
                        {sectionTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {section.type === "ul" ? (
                        <textarea
                          value={section.itemsText}
                          onChange={(event) =>
                            updateSection(section.id, {
                              itemsText: event.target.value,
                            })
                          }
                          placeholder={"Un element par ligne"}
                          rows={5}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                        />
                      ) : (
                        <textarea
                          value={section.text}
                          onChange={(event) =>
                            updateSection(section.id, {
                              text: event.target.value,
                            })
                          }
                          placeholder="Texte de la section"
                          rows={5}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-border bg-background p-4 shadow-sm">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Apercu du blog"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Apercu image
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div
                      className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]"
                      style={{
                        background: `${categoryColor}22`,
                        color: categoryColor,
                      }}
                    >
                      {category || "Categorie"}
                    </div>
                    <h4 className="text-xl font-black text-foreground">
                      {title || "Titre du blog"}
                    </h4>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {desc ||
                        "Votre description apparaitra ici avant publication."}
                    </p>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {date} · {read}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateBlog}
                  disabled={
                    saving || !title.trim() || !desc.trim() || !img.trim()
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple px-4 py-3 text-sm font-semibold text-purple-foreground transition-all hover:bg-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Publier le blog
                </button>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Blogs publies</h3>
              <p className="dashboard-card-subtitle">
                Chaque article cree ici apparait ensuite sur `/blogs` et
                `/blog/[slug]`.
              </p>
            </div>
          </div>

          <div className="dashboard-card-body">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin" />
                Chargement des blogs...
              </div>
            ) : blogs.length === 0 ? (
              <div className="rounded-2xl border border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">
                Aucun blog en base pour le moment.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {blogs.map((blog) => (
                  <article
                    key={blog._id || blog.slug}
                    className="rounded-2xl border border-border bg-background p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
                        <img
                          src={blog.img}
                          alt={blog.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-bold text-foreground">
                              {blog.title}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              /{blog.slug}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              blog._id && handleDeleteBlog(blog._id)
                            }
                            className="rounded-full border border-border p-2 text-muted-foreground hover:border-red-500/40 hover:text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          <p>
                            {blog.category} · {blog.date} · {blog.read}
                          </p>
                          <p className="mt-2 line-clamp-3">{blog.desc}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
