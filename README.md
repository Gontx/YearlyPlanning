# YearlyPlanning

A modern, full-stack yearly planning application built to help users manage their time, track holidays, and organize upcoming plans with a beautiful, grid-based yearly interface.

## 🚀 Key Features

*   **Yearly Overview**: An intuitive grid view (`YearGrid`) of the entire year to visualize density and holidays at a glance.
*   **Holiday Management**: Configure annual leave allowance, track "Bank Holidays", and manage rollover days.
*   **Plan Management**: Add, edit, and organize plans (Work, Personal, Travel, etc.) for specific days or spanning multiple days.
*   **Smart Vacation Tracking**: Automatically calculates holiday allowance usage based on working days (excluding weekends and bank holidays).
*   **Cloud Sync**: Seamless data synchronization across devices using **Firebase Firestore**.
*   **Responsive Design**: optimized for both desktop and mobile web experiences.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Components**: [Shadcn/UI](https://ui.shadcn.com/) (Radix UI + Tailwind)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Validation**: [Zod](https://zod.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Database**: Firebase Firestore

## 📂 Project Structure

```bash
src/
├── app/             # Next.js App Router pages and layouts
├── components/
│   ├── domain/      # Business-specific components (YearGrid, MonthCard, etc.)
│   └── ui/          # Reusable UI components (buttons, dialogs, inputs)
├── lib/
│   ├── firebase/    # Firebase configuration
│   ├── repository/  # Data access layer (FirestoreRepository)
│   └── store/       # Global state management (usePlannerStore)
└── types/           # Shared TypeScript definitions (Plan, Holiday, etc.)
```

## ⚡ Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm, yarn, or bun

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/yearly-planning.git
    cd yearly-planning
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your Firebase configuration keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📐 Architecture Overview

This project follows a **Feature-First** and **Repository Pattern** architecture:
*   **Domain Logic** is kept close to `components/domain`.
*   **Data Access** is abstracted via the `IYearPlannerRepository` interface, allowing the application to switch between `LocalStorage` (for offline/demo) and `Firestore` (for production) easily.
*   **State** is centrally managed via `usePlannerStore`, which coordinates UI updates and persists data to the repository.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
