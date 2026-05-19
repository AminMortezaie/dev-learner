import { useState } from "react";
import { useListArticles, useListLanguages, useCreateArticle, useDeleteArticle, useImportArticleFromUrl, usePolishContent, getListArticlesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, Trash2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  languageId: z.coerce.number().optional(),
  tags: z.string().optional(),
});

const fromUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  languageId: z.coerce.number().optional(),
});

export default function Articles() {
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: languages } = useListLanguages();

  const params: any = {};
  if (selectedLang !== "all") params.languageId = parseInt(selectedLang);

  const { data: articles, isLoading } = useListArticles(params);
  const createArticle = useCreateArticle();
  const deleteArticle = useDeleteArticle();
  const importFromUrl = useImportArticleFromUrl();
  const polishMutation = usePolishContent();

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: "", summary: "", content: "", tags: "" },
  });

  const urlForm = useForm<z.infer<typeof fromUrlSchema>>({
    resolver: zodResolver(fromUrlSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = (data: z.infer<typeof articleSchema>) => {
    createArticle.mutate(
      { data: { ...data, languageId: data.languageId || null } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
          toast({ title: "Article created successfully" });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to create article", variant: "destructive" });
        }
      }
    );
  };

  const onImportFromUrl = (data: z.infer<typeof fromUrlSchema>) => {
    importFromUrl.mutate(
      { url: data.url, languageId: data.languageId || undefined },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
          toast({ title: "Article imported and quiz generated!" });
          setIsAiDialogOpen(false);
          urlForm.reset();
        },
        onError: (err: any) => {
          toast({
            title: "Import failed",
            description: err?.message ?? "Could not import from URL",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
            toast({ title: "Article deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">/articles</h1>
          <p className="text-muted-foreground">Deep dive technical articles and guides.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-mono">
                <Sparkles className="mr-2 h-4 w-4" /> Add by AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Import from URL</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Paste any article or blog post URL. AI will extract the content,
                generate a structured article, and create a quiz automatically.
              </p>
              <Form {...urlForm}>
                <form onSubmit={urlForm.handleSubmit(onImportFromUrl)} className="space-y-4">
                  <FormField
                    control={urlForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={urlForm.control}
                    name="languageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language (optional)</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auto-detect" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages?.map(l => (
                              <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-mono" disabled={importFromUrl.isPending}>
                    {importFromUrl.isPending ? "Importing & generating quiz..." : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Import & Generate Quiz</>
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono"><Plus className="mr-2 h-4 w-4" /> Write Article</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono">Draft New Article</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Deep Dive into..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="languageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages?.map(l => (
                              <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="internals, advanced" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief summary..." className="h-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel>Content (Markdown)</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-mono text-xs h-7 gap-1"
                          disabled={polishMutation.isPending || !field.value}
                          onClick={() => {
                            polishMutation.mutate(field.value, {
                              onSuccess: (res) => {
                                form.setValue("content", res.content, { shouldDirty: true });
                                toast({ title: "Content polished!" });
                              },
                              onError: (err: any) => toast({ title: "Polish failed", description: err?.message ?? "Unknown error", variant: "destructive" }),
                            });
                          }}
                        >
                          <Sparkles className="h-3 w-3" />
                          {polishMutation.isPending ? "Polishing..." : "Polish with AI"}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Paste raw content here, then hit 'Polish with AI'..." className="h-64 font-mono text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createArticle.isPending}>
                  {createArticle.isPending ? "Publishing..." : "Publish Article"}
                </Button>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={selectedLang} onValueChange={setSelectedLang}>
          <SelectTrigger className="w-full sm:w-[200px] font-mono">
            <SelectValue placeholder="Filter by Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages?.map((lang) => (
              <SelectItem key={lang.id} value={lang.id.toString()}>{lang.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)
        ) : articles?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No articles found.
          </div>
        ) : (
          articles?.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`}>
              <Card className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      {article.languageName && <Badge variant="outline" className="font-mono text-xs">{article.languageName}</Badge>}
                      {article.hasQuiz && <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-none font-mono text-xs">Quiz Available</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(e, article.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{article.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-mono">
                    {new Date(article.createdAt!).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">{article.summary || article.content.substring(0, 150) + "..."}</p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center text-sm font-mono text-muted-foreground">
                  <div className="flex gap-2 flex-wrap">
                    {article.tags && article.tags.split(',').slice(0, 3).map(t => (
                      <span key={t}>#{t.trim()}</span>
                    ))}
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}