/**
 * Diese Datei enthält die ContextMenu-Komponente.
 * Sie ermöglicht die Erstellung eines kontextsensitiven Menüs mit verschiedenen Elementen.
 *
 * @autor Farah. 
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={`
        min-w-[8rem]
        overflow-hidden
        rounded-md
        border
        bg-white
        p-1
        shadow-md
        animate-in
        fade-in-80
        ${className}
      `}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={`
      relative
      flex
      cursor-default
      select-none
      items-center
      rounded-sm
      px-2
      py-1.5
      text-sm
      outline-none
      transition-colors
      hover:bg-accent
      hover:text-accent-foreground
      data-[disabled]:pointer-events-none
      data-[disabled]:opacity-50
      ${className}
    `}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem };
