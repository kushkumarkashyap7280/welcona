"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { saveHomeConfigAction } from "@/lib/actions/home-config";
import type { HomePageConfig, CategoryItemConfig, StatItemConfig, HotTabItem } from "@/lib/home-config";

interface Category {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
}

interface Props {
  initialConfig: HomePageConfig;
  categories: Category[];
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Switch checked={enabled} onCheckedChange={onToggle} />
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen((v) => !v)}
          disabled={!enabled}
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {open && enabled && (
        <div className="border-t px-5 py-4 space-y-4 bg-muted/20">{children}</div>
      )}
    </div>
  );
}

// ─── Field Helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="text-sm"
      />
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function HomePageClient({ initialConfig, categories: _categories }: Props) {
  const [config, setConfig] = useState<HomePageConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof HomePageConfig>(
    key: K,
    value: HomePageConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function updateNested<
    K extends keyof HomePageConfig,
    F extends keyof HomePageConfig[K]
  >(section: K, field: F, value: HomePageConfig[K][F]) {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveHomeConfigAction(config);
      if (result.success) {
        toast.success("Home page configuration saved!");
      } else {
        toast.error(result.message ?? "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Hero Section"
        description="Full-screen hero with background image and headline"
        enabled={config.hero.enabled}
        onToggle={(v) => updateNested("hero", "enabled", v)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-medium">
              Headline <span className="text-muted-foreground">(use \n for line break)</span>
            </Label>
            <Input
              value={config.hero.headline}
              onChange={(e) => updateNested("hero", "headline", e.target.value)}
              placeholder="Elevate Your\nBathroom Experience"
              className="h-8 text-sm"
            />
          </div>
          <TextareaField
            label="Subtitle"
            value={config.hero.subtitle}
            onChange={(v) => updateNested("hero", "subtitle", v)}
            placeholder="Factory-direct luxury bath fittings..."
          />
          <Field
            label="Background Image URL"
            value={config.hero.backgroundImage}
            onChange={(v) => updateNested("hero", "backgroundImage", v)}
            placeholder="https://images.unsplash.com/..."
          />
          <Field
            label="Primary CTA Text"
            value={config.hero.primaryCtaText}
            onChange={(v) => updateNested("hero", "primaryCtaText", v)}
          />
          <Field
            label="Primary CTA Link"
            value={config.hero.primaryCtaLink}
            onChange={(v) => updateNested("hero", "primaryCtaLink", v)}
          />
          <Field
            label="Secondary CTA Text"
            value={config.hero.secondaryCtaText}
            onChange={(v) => updateNested("hero", "secondaryCtaText", v)}
          />
          <Field
            label="Secondary CTA Link"
            value={config.hero.secondaryCtaLink}
            onChange={(v) => updateNested("hero", "secondaryCtaLink", v)}
          />
        </div>
      </SectionCard>

      {/* ── Marquee Strip ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Marquee Trust Strip"
        description="Scrolling trust badges below the hero"
        enabled={config.marquee.enabled}
        onToggle={(v) => updateNested("marquee", "enabled", v)}
      >
        <div className="space-y-2">
          <Label className="text-xs font-medium">Items</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {config.marquee.items.map((item, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {item}
                <button
                  onClick={() => {
                    const items = config.marquee.items.filter((_, idx) => idx !== i);
                    updateNested("marquee", "items", items);
                  }}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="marquee-new"
              placeholder="Add item..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    updateNested("marquee", "items", [...config.marquee.items, val]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const input = document.getElementById("marquee-new") as HTMLInputElement;
                const val = input?.value.trim();
                if (val) {
                  updateNested("marquee", "items", [...config.marquee.items, val]);
                  input.value = "";
                }
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── Hot Tabs ──────────────────────────────────────────────────────── */}
      <SectionCard
        title="Hot Tabs"
        description="Horizontal product filter tabs below the hero"
        enabled={config.hotTabs.enabled}
        onToggle={(v) => updateNested("hotTabs", "enabled", v)}
      >
        <div className="space-y-3">
          {config.hotTabs.tabs.map((tab, i) => (
            <div key={tab.id} className="flex gap-2 items-center">
              <Input
                value={tab.label}
                onChange={(e) => {
                  const tabs = config.hotTabs.tabs.map((t, idx) =>
                    idx === i ? { ...t, label: e.target.value } : t
                  );
                  updateNested("hotTabs", "tabs", tabs);
                }}
                placeholder="Label"
                className="h-8 text-sm flex-1"
              />
              <Input
                value={tab.apiFilter}
                onChange={(e) => {
                  const tabs = config.hotTabs.tabs.map((t, idx) =>
                    idx === i ? { ...t, apiFilter: e.target.value } : t
                  );
                  updateNested("hotTabs", "tabs", tabs);
                }}
                placeholder="API filter (e.g. sort=discount)"
                className="h-8 text-sm flex-1"
              />
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  const tabs = config.hotTabs.tabs.filter((_, idx) => idx !== i);
                  updateNested("hotTabs", "tabs", tabs);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newTab: HotTabItem = {
                id: `tab_${Date.now()}`,
                label: "New Tab",
                apiFilter: "",
              };
              updateNested("hotTabs", "tabs", [...config.hotTabs.tabs, newTab]);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Tab
          </Button>
        </div>
      </SectionCard>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <SectionCard
        title="Category Showcase"
        description="Alternating left/right category feature sections with images"
        enabled={config.categories.enabled}
        onToggle={(v) => updateNested("categories", "enabled", v)}
      >
        <div className="space-y-5">
          {config.categories.items.map((cat, i) => (
            <div key={i} className="border rounded-lg p-4 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Category {i + 1}</Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    const items = config.categories.items.filter((_, idx) => idx !== i);
                    updateNested("categories", "items", items);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Title"
                  value={cat.title}
                  onChange={(v) => {
                    const items = config.categories.items.map((c, idx) =>
                      idx === i ? { ...c, title: v } : c
                    );
                    updateNested("categories", "items", items);
                  }}
                />
                <Field
                  label="Image URL"
                  value={cat.image}
                  onChange={(v) => {
                    const items = config.categories.items.map((c, idx) =>
                      idx === i ? { ...c, image: v } : c
                    );
                    updateNested("categories", "items", items);
                  }}
                />
                <Field
                  label="Link (href)"
                  value={cat.href}
                  onChange={(v) => {
                    const items = config.categories.items.map((c, idx) =>
                      idx === i ? { ...c, href: v } : c
                    );
                    updateNested("categories", "items", items);
                  }}
                />
                <Field
                  label="Tags (comma separated)"
                  value={cat.tags.join(", ")}
                  onChange={(v) => {
                    const tags = v.split(",").map((t) => t.trim()).filter(Boolean);
                    const items = config.categories.items.map((c, idx) =>
                      idx === i ? { ...c, tags } : c
                    );
                    updateNested("categories", "items", items);
                  }}
                />
                <div className="col-span-2">
                  <TextareaField
                    label="Description"
                    value={cat.description}
                    onChange={(v) => {
                      const items = config.categories.items.map((c, idx) =>
                        idx === i ? { ...c, description: v } : c
                      );
                      updateNested("categories", "items", items);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newCat: CategoryItemConfig = {
                title: "New Category",
                description: "",
                image: "",
                href: "/products",
                tags: [],
              };
              updateNested("categories", "items", [...config.categories.items, newCat]);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Category
          </Button>
        </div>
      </SectionCard>

      {/* ── Stats Section ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Stats Counter Section"
        description="Animated number counters (counts up when scrolled into view)"
        enabled={config.stats.enabled}
        onToggle={(v) => updateNested("stats", "enabled", v)}
      >
        <div className="space-y-3">
          {config.stats.items.map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                type="number"
                value={stat.value}
                onChange={(e) => {
                  const items = config.stats.items.map((s, idx) =>
                    idx === i ? { ...s, value: Number(e.target.value) } : s
                  );
                  updateNested("stats", "items", items);
                }}
                placeholder="Value"
                className="h-8 text-sm w-24"
              />
              <Input
                value={stat.suffix}
                onChange={(e) => {
                  const items = config.stats.items.map((s, idx) =>
                    idx === i ? { ...s, suffix: e.target.value } : s
                  );
                  updateNested("stats", "items", items);
                }}
                placeholder="Suffix (+, Yr...)"
                className="h-8 text-sm w-24"
              />
              <Input
                value={stat.label}
                onChange={(e) => {
                  const items = config.stats.items.map((s, idx) =>
                    idx === i ? { ...s, label: e.target.value } : s
                  );
                  updateNested("stats", "items", items);
                }}
                placeholder="Label"
                className="h-8 text-sm flex-1"
              />
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  const items = config.stats.items.filter((_, idx) => idx !== i);
                  updateNested("stats", "items", items);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newStat: StatItemConfig = { value: 0, suffix: "+", label: "New Stat" };
              updateNested("stats", "items", [...config.stats.items, newStat]);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Stat
          </Button>
        </div>
      </SectionCard>

      {/* ── Offers Banner ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Offers Banner"
        description="Full-width promotional banner with image background"
        enabled={config.offersBanner.enabled}
        onToggle={(v) => updateNested("offersBanner", "enabled", v)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Title"
            value={config.offersBanner.title}
            onChange={(v) => updateNested("offersBanner", "title", v)}
          />
          <Field
            label="Background Image URL"
            value={config.offersBanner.backgroundImage}
            onChange={(v) => updateNested("offersBanner", "backgroundImage", v)}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="Subtitle"
              value={config.offersBanner.subtitle}
              onChange={(v) => updateNested("offersBanner", "subtitle", v)}
            />
          </div>
          {config.offersBanner.highlights.map((h, i) => (
            <Field
              key={i}
              label={`Highlight ${i + 1}`}
              value={h}
              onChange={(v) => {
                const highlights = config.offersBanner.highlights.map((s, idx) =>
                  idx === i ? v : s
                );
                updateNested("offersBanner", "highlights", highlights);
              }}
            />
          ))}
          <Field
            label="CTA Button Text"
            value={config.offersBanner.ctaText}
            onChange={(v) => updateNested("offersBanner", "ctaText", v)}
          />
          <Field
            label="CTA Button Link"
            value={config.offersBanner.ctaLink}
            onChange={(v) => updateNested("offersBanner", "ctaLink", v)}
          />
        </div>
      </SectionCard>

      {/* ── Why Welcona ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Why Welcona"
        description="Trust features grid (8 cards with icons)"
        enabled={config.whyWelcona.enabled}
        onToggle={(v) => update("whyWelcona", { enabled: v })}
      >
        <p className="text-sm text-muted-foreground">
          This section displays fixed trust badges. To edit content, update the WhyWelcona component directly.
        </p>
      </SectionCard>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <SectionCard
        title="Bottom CTA"
        description="Call-to-action banner at the bottom of the page"
        enabled={config.bottomCta.enabled}
        onToggle={(v) =>
          setConfig((prev) => ({
            ...prev,
            bottomCta: { ...prev.bottomCta, enabled: v },
          }))
        }
      >
        <div className="space-y-3">
          <Field
            label="Headline"
            value={config.bottomCta.headline}
            onChange={(v) =>
              setConfig((prev) => ({
                ...prev,
                bottomCta: { ...prev.bottomCta, headline: v },
              }))
            }
          />
          <TextareaField
            label="Subtitle"
            value={config.bottomCta.subtitle}
            onChange={(v) =>
              setConfig((prev) => ({
                ...prev,
                bottomCta: { ...prev.bottomCta, subtitle: v },
              }))
            }
          />
        </div>
      </SectionCard>

      {/* ── Save Button ───────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="gap-2 px-8"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
