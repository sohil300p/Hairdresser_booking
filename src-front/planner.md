# Migrate AI Studio Structure to Barber Module

## 1. Update Types (`src-front/barber/types.ts`)

- Add missing `BarberPage` options: `'profile-setup'`, `'club'`, `'terms'`, `'edit-profile'`.
- Add types for Customer Club: `Reward`, `Member` (Club Member), `PointTransaction`.
- Consolidate `ProfileFormData` and `Service` types.

## 2. Update Mock Data (`src-front/barber/constants/mockData.ts`)

- Add mock data for Customer Club: `MOCK_REWARDS`, `MOCK_CLUB_MEMBERS`, `MOCK_POINT_HISTORY`.

## 3. Migrate Components

- Create `src-front/barber/components/VoiceControl.tsx` (from `VoiceControl.tsx`).
- Create `src-front/barber/components/ErrorBoundary.tsx` (from `ErrorBoundary.tsx`).

## 4. Migrate Pages

- **Profile Setup**: Create `src-front/barber/pages/ProfileSetupPage.tsx` (from `ProfileSetupScreen.tsx`).
- **Customer Club**: Create `src-front/barber/pages/CustomerClubPage.tsx` (from `CustomerClubScreen.tsx`).
- **Terms**: Create `src-front/barber/pages/TermsPage.tsx` (from `TermsSubPage.tsx`).
- **Edit Profile**: Create `src-front/barber/pages/EditProfilePage.tsx` (from `EditProfileScreen.tsx`).

## 5. Update `BarberApp.tsx`

- Add routes for new pages (`profile-setup`, `club`, `terms`, `edit-profile`).
- Integrate `VoiceControl` component.
- Ensure navigation flows match the AI Studio reference (e.g., accessing club from dashboard or menu).

## 6. Dependencies

- Ensure `lucide-react` and `recharts` are available (assumed present or will be added).