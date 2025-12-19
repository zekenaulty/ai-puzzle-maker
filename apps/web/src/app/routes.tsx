import { Route, Routes } from 'react-router-dom'
import Shell from './layout/Shell'
import AboutPage from '../pages/AboutPage/AboutPage'
import CreatePuzzlePage from '../pages/CreatePuzzlePage/CreatePuzzlePage'
import HomePage from '../pages/HomePage/HomePage'
import LibraryPage from '../pages/LibraryPage/LibraryPage'
import PuzzlePlayPage from '../pages/PuzzlePlayPage/PuzzlePlayPage'
import SettingsPage from '../pages/SettingsPage/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="create" element={<CreatePuzzlePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="play/:puzzleId" element={<PuzzlePlayPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  )
}
