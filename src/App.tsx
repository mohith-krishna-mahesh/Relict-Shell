import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { CoreConnectionProvider } from './app/auth/AuthGuard';
import { EntryPage } from './app/entry/EntryPage';
import { SignInPage } from './app/auth/SignInPage';
import { SignUpPage } from './app/auth/SignUpPage';
import { ConnectCorePage } from './app/onboarding/ConnectCorePage';
import { OverviewPage } from './app/project/OverviewPage';
import { PlannerPage } from './app/project/PlannerPage';
import { ProjectLayout } from './app/project/ProjectLayout';
import { RunsPage } from './app/project/RunsPage';
import { KnowledgeGraphPage } from './app/project/knowledge-graph/KnowledgeGraphPage';
import { SettingsPage } from './app/settings/SettingsPage';
import { WorkspacePage } from './app/workspace/WorkspacePage';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables.');
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function ThemedClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY || ''}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: '#EE8E28',
          colorBackground: isDark ? '#18130E' : '#FFFFFF',
          colorText: isDark ? '#FFFFFF' : '#140D07',
          colorTextSecondary: isDark ? '#E2D5C3' : '#4A3B2A',
          colorInputBackground: isDark ? '#140D07' : '#FFFFFF',
          colorInputText: isDark ? '#FFFFFF' : '#140D07',
          colorNeutral: isDark ? '#FFFFFF' : '#140D07',
          colorShimmer: isDark ? '#201A14' : '#F7F2E9',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '0.875rem',
        },
        elements: {
          card: isDark
            ? '!bg-[#18130E] !border-white/10 !text-white'
            : '!bg-white !border-[#140D07]/10 !text-[#140D07]',
          navbar: isDark
            ? '!bg-[#140D07] !border-r !border-white/10'
            : '!bg-[#F7F2E9] !border-r !border-[#140D07]/10',
          navbarButton: isDark
            ? '!text-[#E2D5C3] hover:!text-white hover:!bg-white/10'
            : '!text-[#4A3B2A] hover:!text-[#140D07] hover:!bg-black/5',
          headerTitle: isDark ? '!text-white' : '!text-[#140D07]',
          headerSubtitle: isDark ? '!text-[#E2D5C3]' : '!text-[#4A3B2A]',
          profileSectionTitle: isDark
            ? '!text-white !border-b !border-white/10'
            : '!text-[#140D07] !border-b !border-[#140D07]/10',
          profileSectionTitleText: isDark ? '!text-white font-semibold' : '!text-[#140D07] font-semibold',
          profileSectionContent: isDark ? '!text-[#E2D5C3]' : '!text-[#4A3B2A]',
          profileSectionPrimaryButton: isDark
            ? '!text-[#FCBA48] hover:!text-[#FFE49E]'
            : '!text-[#B25A12] hover:!text-[#140D07]',
          userPreviewMainIdentifier: isDark ? '!text-white' : '!text-[#140D07]',
          userPreviewSecondaryIdentifier: isDark ? '!text-[#E2D5C3]' : '!text-[#4A3B2A]',
          userButtonPopoverCard: isDark ? '!bg-[#18130E] !border-white/10' : '!bg-white !border-[#140D07]/10',
          userButtonPopoverMain: isDark ? '!bg-[#18130E]' : '!bg-white',
          userButtonPopoverActionButton: isDark
            ? '!text-white hover:!bg-white/10'
            : '!text-[#140D07] hover:!bg-[#FFE49E]/20',
          userButtonPopoverActionButtonText: isDark ? '!text-white' : '!text-[#140D07]',
          userButtonPopoverActionButtonIcon: isDark ? '!text-[#FCBA48]' : '!text-[#EE8E28]',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ThemedClerkProvider>
        <BrowserRouter>
          <CoreConnectionProvider>
            <Routes>
              {/* Entry / Landing page */}
              <Route
                path="/"
                element={
                  <>
                    <SignedIn>
                      <Navigate to="/workspace" replace />
                    </SignedIn>
                    <SignedOut>
                      <EntryPage />
                    </SignedOut>
                  </>
                }
              />

              {/* Auth routes */}
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />

              {/* Authenticated app routes */}
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <WorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connect-core"
                element={
                  <ProtectedRoute>
                    <ConnectCorePage />
                  </ProtectedRoute>
                }
              />

              {/* Project routes */}
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OverviewPage />} />
                <Route path="planner" element={<PlannerPage />} />
                <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
                <Route path="runs" element={<RunsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CoreConnectionProvider>
        </BrowserRouter>
      </ThemedClerkProvider>
    </ThemeProvider>
  );
}

export default App;
