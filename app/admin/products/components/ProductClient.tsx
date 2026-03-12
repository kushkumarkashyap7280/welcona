"use client";

import { useState } from "react";
import { Product } from "@/lib/generated/prisma/client";
import { Plus, Edit, Trash, Package } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProductAction } from "@/lib/actions/products";
import { ProductFormDialog } from "./ProductFormDialog";

type ProductWithCategory = Product & {
  category: { id: string; name: string };
};

interface ProductClientProps {
  data: ProductWithCategory[];
  categories: { id: string; name: string }[];
}

export function ProductClient({ data, categories }: ProductClientProps) {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const res = await deleteProductAction(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Product deleted");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground mt-2">
            Manage your inventory, pricing, and product details.
          </p>
        </div>
        <Button onClick={() => {
          setEditingProduct(null);
          setOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              All Products
            </CardTitle>
            <Input
              placeholder="Search by name or SKU..."
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                        {product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Package className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground opacity-20" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-base">{product.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {product.sku}</div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${product.retailPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProduct(product);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductFormDialog 
        open={open} 
        onOpenChange={setOpen} 
        initialData={editingProduct}
        categories={categories}
      />
    </>
  );
}
