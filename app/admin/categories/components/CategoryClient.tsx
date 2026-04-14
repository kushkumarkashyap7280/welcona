"use client";

import { useState } from "react";
import { Category } from "@/lib/generated/prisma/client";
import { Plus, Edit, Trash, Tags } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { deleteCategoryAction } from "@/lib/actions/categories";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { Badge } from "@/components/ui/badge";

type CategoryWithCount = Category & {
  _count: {
    products: number;
  };
};

interface CategoryClientProps {
  data: CategoryWithCount[];
}

export function CategoryClient({ data }: CategoryClientProps) {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const res = await deleteCategoryAction(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Category deleted");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground mt-2">
            Manage your product categories and collections.
          </p>
        </div>
        <Button onClick={() => {
          setEditingCategory(null);
          setOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Tags className="h-5 w-5 text-muted-foreground" />
              All Categories
            </CardTitle>
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-75 py-4">Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {category._count.products} products
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCategory(category);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={category._count.products > 0}
                        title={category._count.products > 0 ? "Cannot delete category with products" : "Delete category"}
                      >
                        <Trash className={`h-4 w-4 ${category._count.products > 0 ? "text-muted-foreground" : "text-red-500"}`} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CategoryFormDialog 
        open={open} 
        onOpenChange={setOpen} 
        initialData={editingCategory}
      />
    </>
  );
}
