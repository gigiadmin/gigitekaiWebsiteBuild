/**
 * Admin UI Loader — Lazy-loads all Radix UI components only when admin pages need them.
 * This keeps the homepage vendor bundle small by deferring Radix UI import until admin access.
 *
 * Usage in admin pages:
 *   const { Button, Dialog, Select, ... } = await import('./lib/admin-ui-loader');
 *
 * This creates a separate chunk that's only downloaded when an admin page is visited.
 */

// Re-export all shadcn/ui components from a single lazy-loadable module
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
export { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
export { AspectRatio } from '@/components/ui/aspect-ratio';
export { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
export { Badge } from '@/components/ui/badge';
export { Button } from '@/components/ui/button';
export { Calendar } from '@/components/ui/calendar';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
export { Checkbox } from '@/components/ui/checkbox';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '@/components/ui/command';
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
export { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarLabel, MenubarCheckboxItem, MenubarRadioItem, MenubarRadioGroup, MenubarPortal, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarShortcut } from '@/components/ui/menubar';
export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport } from '@/components/ui/navigation-menu';
export { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
export { Progress } from '@/components/ui/progress';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
export { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator } from '@/components/ui/select';
export { Separator } from '@/components/ui/separator';
export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from '@/components/ui/sheet';
export { Slider } from '@/components/ui/slider';
export { Switch } from '@/components/ui/switch';
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export { Toggle } from '@/components/ui/toggle';
export { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
