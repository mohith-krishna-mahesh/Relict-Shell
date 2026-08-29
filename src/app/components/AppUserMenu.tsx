import { UserButton } from '@clerk/clerk-react';

export function AppUserMenu() {
  return (
    <UserButton
      afterSignOutUrl="/sign-in"
      appearance={{
        elements: {
          avatarBox:
            'h-9 w-9 rounded-full ring-2 ring-[#EE8E28]/40 transition hover:ring-[#EE8E28]',
          userButtonPopoverCard:
            'shadow-2xl rounded-2xl border border-[#140D07]/10 bg-white dark:border-white/10 dark:bg-[#18130E]',
          userButtonPopoverMain:
            'bg-transparent dark:bg-[#18130E]',
          userPreview:
            'bg-transparent text-[#140D07] dark:text-white',
          userPreviewMainIdentifier:
            'text-sm font-semibold text-[#140D07] dark:text-white',
          userPreviewSecondaryIdentifier:
            'text-xs text-[#4A3B2A] dark:text-[#E2D5C3]',
          userButtonPopoverActionButton:
            'text-[#140D07] hover:bg-[#FFE49E]/25 dark:text-white dark:hover:bg-white/10 transition',
          userButtonPopoverActionButtonText:
            'text-sm font-medium text-[#140D07] dark:text-white',
          userButtonPopoverActionButtonIcon:
            'text-[#EE8E28] dark:text-[#FCBA48]',
          userButtonPopoverFooter:
            'hidden',
          // UserProfile Modal elements (Manage Account)
          modalBackdrop:
            'bg-[#140D07]/60 backdrop-blur-sm dark:bg-black/80',
          modalContent:
            'rounded-3xl border border-[#140D07]/10 bg-white dark:border-white/10 dark:bg-[#18130E]',
          card:
            'bg-white dark:bg-[#18130E]',
          navbar:
            'bg-[#F7F2E9] border-r border-[#140D07]/10 dark:bg-[#140D07] dark:border-white/10',
          navbarButton:
            'text-[#4A3B2A] hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:text-white',
          headerTitle:
            'text-[#140D07] dark:text-white font-semibold',
          headerSubtitle:
            'text-[#4A3B2A] dark:text-[#E2D5C3]',
          profileSectionTitle:
            'text-[#140D07] dark:text-white border-b border-[#140D07]/10 dark:border-white/10',
          profileSectionContent:
            'text-[#4A3B2A] dark:text-[#E2D5C3]',
          formFieldLabel:
            'text-[#4A3B2A] dark:text-[#E2D5C3]',
          formFieldInput:
            'border border-[#140D07]/15 bg-white text-[#140D07] dark:border-white/15 dark:bg-[#140D07] dark:text-white',
          formButtonPrimary:
            'bg-[#140D07] text-white hover:bg-[#B25A12] dark:bg-[#EE8E28] dark:text-white dark:hover:bg-[#B25A12]',
        },
      }}
    />
  );
}

export default AppUserMenu;
