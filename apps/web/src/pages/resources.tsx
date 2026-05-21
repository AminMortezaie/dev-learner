import { useState } from "react";
import {
  useListResources,
  useListLanguages,
  useCreateResource,
  useDeleteResource,
  getListResourcesQueryKey,
  type ResourceInput,
  type ListResourcesParams,
} from "@devlearn/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Plus, ExternalLink, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["article", "video", "documentation", "github", "course", "book"]),
  description: z.string().optional(),
  languageId: z.coerce.number().optional(),
  topicId: z.coerce.number().optional(),
  tags: z.string().optional(),
});

export default function Resources() {
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: languages } = useListLanguages();
  
  const params: ListResourcesParams = {};
  if (selectedLang !== "all") params.languageId = parseInt(selectedLang);
  if (selectedType !== "all") params.type = selectedType as ListResourcesParams["type"];

  const { data: resources, isLoading } = useListResources(params);
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();

  const form = useForm<z.infer<typeof resourceSchema>>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      url: "",
      type: "article",
      description: "",
      tags: "",
    },
  });

  const onSubmit = (data: z.infer<typeof resourceSchema>) => {
    const payload: ResourceInput = {
      title: data.title,
      url: data.url,
      type: data.type,
      description: data.description,
      tags: data.tags,
      languageId: data.languageId ?? null,
      topicId: data.topicId ?? null,
    };
    createResource.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
          toast({ title: "Resource added successfully" });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to add resource", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      deleteResource.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
            toast({ title: "Resource deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">/resources</h1>
          <p className="text-muted-foreground">External learning materials, curated.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono"><Plus className="mr-2 h-4 w-4" /> Add Resource</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono">Add External Resource</DialogTitle>
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
                        <Input placeholder="Resource Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="documentation">Documentation</SelectItem>
                            <SelectItem value="github">GitHub</SelectItem>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="book">Book</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="languageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language (Optional)</FormLabel>
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
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description..." {...field} />
                      </FormControl>
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
                        <Input placeholder="architecture, scalability" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createResource.isPending}>
                  {createResource.isPending ? "Adding..." : "Add Resource"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[200px] font-mono">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="documentation">Documentation</SelectItem>
            <SelectItem value="github">GitHub</SelectItem>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="book">Book</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : resources?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No resources found.
          </div>
        ) : (
          resources?.map((resource) => (
            <Card key={resource.id} className="bg-card/50 backdrop-blur border-border/50 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{resource.type}</Badge>
                    {resource.languageName && <Badge variant="secondary" className="font-mono text-xs">{resource.languageName}</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(resource.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                {resource.tags && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {resource.tags.split(',').map(t => (
                      <span key={t} className="text-xs text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">#{t.trim()}</span>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="link" className="px-0 h-auto font-mono text-sm text-muted-foreground hover:text-primary" asChild>
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-3 w-3" /> Visit Resource
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}