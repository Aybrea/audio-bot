"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/modal";

import type { TOCItem } from "@/types/epub";

interface EpubTocProps {
  isOpen: boolean;
  toc: TOCItem[];
  onClose: () => void;
  onNavigate: (href: string) => void;
}

interface TocItemProps {
  item: TOCItem;
  onNavigate: (href: string) => void;
  level?: number;
}

function TocItemComponent({ item, onNavigate, level = 0 }: TocItemProps) {
  const handleClick = () => {
    onNavigate(item.href);
  };

  return (
    <div className="toc-item">
      <button
        className={`
          w-full text-left py-2 px-3 rounded-lg
          hover:bg-default-100 transition-colors
          ${level > 0 ? "ml-" + (level * 4) : ""}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        <span className="text-sm">{item.label}</span>
      </button>

      {item.subitems && item.subitems.length > 0 && (
        <div className="toc-subitems">
          {item.subitems.map((subitem) => (
            <TocItemComponent
              key={subitem.id}
              item={subitem}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EpubToc({ isOpen, toc, onClose, onNavigate }: EpubTocProps) {
  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">目录</h2>
        </ModalHeader>
        <ModalBody className="py-4">
          {toc.length === 0 ? (
            <div className="text-center text-default-400 py-8">
              <p>此书籍没有目录</p>
            </div>
          ) : (
            <div className="space-y-1">
              {toc.map((item) => (
                <TocItemComponent
                  key={item.id}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
