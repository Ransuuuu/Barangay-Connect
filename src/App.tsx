import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"

type Role = "resident" | "admin" | "superadmin"
type AdminLevel = 1 | 2 | 3
type Status = "Pending" | "Under Review" | "In Progress" | "Resolved" | "Rejected"
type Page = "home" | "login" | "register" | "dashboard" | "submit" | "my-reports" | "reports" | "map" | "report-detail" | "announcements" | "residents" | "admins" | "system-reports" | "settings" | "profile"
type MapPosition = { lat: number; lng: number }
type Theme = "light" | "dark"
type Language = "en" | "fil"
type Report = {
  id: string
  title: string
  category: string
  description: string
  location: string
  date: string
  status: Status
  resident: string
  priority: string
  remarks: string
  position: MapPosition
  photo?: string
}
type Person = {
  id: string
  name: string
  email: string
  contact: string
  address: string
  status: string
  date?: string
  level?: AdminLevel
}
type Announcement = {
  id: number
  title: string
  date: string
  category: string
  description: string
}

const initialReports: Report[] = [
  {
    id: "BC-2025-041",
    title: "Broken streetlight on Mabini Street",
    category: "Streetlight",
    description:
      "The streetlight near the corner of Mabini Street has not been working for several nights. The area gets quite dark in the evening.",
    location: "Mabini Street, near the basketball court",
    date: "May 21, 2025",
    status: "In Progress",
    resident: "Maria Santos",
    priority: "Medium",
    remarks: "Your concern has been forwarded to the maintenance team.",
    position: { lat: 14.2913, lng: 122.6937 },
  },
  {
    id: "BC-2025-038",
    title: "Garbage collection delay",
    category: "Garbage",
    description: "Garbage has not been collected in our street this week.",
    location: "Rizal Street, Zone 2",
    date: "May 19, 2025",
    status: "Under Review",
    resident: "Maria Santos",
    priority: "Low",
    remarks: "We are reviewing your concern.",
    position: { lat: 14.2888, lng: 122.6945 },
  },
  {
    id: "BC-2025-032",
    title: "Pothole near the market",
    category: "Road Damage",
    description: "There is a large pothole by the public market entrance.",
    location: "Market Road, Zone 1",
    date: "May 15, 2025",
    status: "Resolved",
    resident: "Maria Santos",
    priority: "High",
    remarks: "The road has been repaired. Thank you for reporting.",
    position: { lat: 14.2885, lng: 122.6917 },
  },
  {
    id: "BC-2025-029",
    title: "Low water pressure in Zone 3",
    category: "Water",
    description: "Water pressure has been low since Monday morning.",
    location: "Zone 3",
    date: "May 12, 2025",
    status: "Pending",
    resident: "Juan Dela Cruz",
    priority: "Medium",
    remarks: "",
    position: { lat: 14.2878, lng: 122.6962 },
  },
  {
    id: "BC-2025-025",
    title: "Obstructed sidewalk",
    category: "Safety",
    description: "The sidewalk is blocked by debris.",
    location: "Bonifacio Avenue",
    date: "May 10, 2025",
    status: "Resolved",
    resident: "Ana Reyes",
    priority: "Low",
    remarks: "The sidewalk has been cleared.",
    position: { lat: 14.2865, lng: 122.6964 },
  },
]
const initialResidents: Person[] = [
  {
    id: "RES-001",
    name: "Maria Santos",
    email: "maria@example.com",
    contact: "0917 123 4567",
    address: "24 Mabini Street, Zone 2",
    status: "Active",
  },
  {
    id: "RES-002",
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    contact: "0918 234 5678",
    address: "18 Rizal Street, Zone 3",
    status: "Active",
  },
  {
    id: "RES-003",
    name: "Ana Reyes",
    email: "ana@example.com",
    contact: "0919 345 6789",
    address: "7 Bonifacio Avenue",
    status: "Active",
  },
]
const initialAdmins: Person[] = [
  {
    id: "ADM-001",
    name: "Elena Cruz",
    email: "admin@barangayconnect.ph",
    contact: "0917 555 0101",
    address: "Barangay San Isidro",
    status: "Active",
    date: "Apr 10, 2025",
    level: 3,
  },
  {
    id: "ADM-002",
    name: "Paolo Mendoza",
    email: "paolo@barangayconnect.ph",
    contact: "0917 555 0102",
    address: "Barangay Mabuhay",
    status: "Active",
    date: "Apr 18, 2025",
    level: 2,
  },
  {
    id: "ADM-003",
    name: "Lea Garcia",
    email: "lea@barangayconnect.ph",
    contact: "0917 555 0103",
    address: "Barangay Maligaya",
    status: "Active",
    date: "May 02, 2025",
    level: 1,
  },
]
const initialAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Community Clean-Up Drive",
    date: "May 24, 2025",
    category: "Community",
    description:
      "Join us this Saturday for our community clean-up activity. Let’s work together to keep our streets clean and welcoming. Meet us at the barangay hall at 7:00 AM.",
  },
  {
    id: 2,
    title: "Free Health Check-Up",
    date: "May 20, 2025",
    category: "Health",
    description:
      "Free basic health consultations and blood pressure checks are available at the barangay health center this Friday, from 9:00 AM to 3:00 PM.",
  },
  {
    id: 3,
    title: "Barangay Hall Holiday Schedule",
    date: "May 16, 2025",
    category: "Notice",
    description:
      "Please note our updated office hours for the upcoming holiday. Regular services will resume on the next business day.",
  },
]
const statuses: Status[] = [
  "Pending",
  "Under Review",
  "In Progress",
  "Resolved",
  "Rejected",
]
const categories = [
  "Garbage",
  "Road Damage",
  "Streetlight",
  "Water",
  "Safety",
  "Other",
]
const API_BASE_URL = "/api"

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(errorBody.message || "Request failed")
  }

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    return undefined as T
  }

  return (await response.json()) as T
}

const menus: Record<Role, { label: string; page: Page; icon: string }[]> = {
  resident: [
    { label: "Dashboard", page: "dashboard", icon: "grid" },
    { label: "Submit Concern", page: "submit", icon: "plusSquare" },
    { label: "My Reports", page: "my-reports", icon: "file" },
    { label: "Report Map", page: "map", icon: "pin" },
    { label: "Announcements", page: "announcements", icon: "megaphone" },
    { label: "Profile", page: "profile", icon: "user" },
  ],
  admin: [
    { label: "Dashboard", page: "dashboard", icon: "grid" },
    { label: "Reports", page: "reports", icon: "file" },
    { label: "Report Map", page: "map", icon: "pin" },
    { label: "Residents", page: "residents", icon: "users" },
    { label: "Announcements", page: "announcements", icon: "megaphone" },
    { label: "Profile", page: "profile", icon: "user" },
  ],
  superadmin: [
    { label: "Dashboard", page: "dashboard", icon: "grid" },
    { label: "Manage Admins", page: "admins", icon: "shield" },
    { label: "Residents", page: "residents", icon: "users" },
    { label: "Reports", page: "reports", icon: "file" },
    { label: "Report Map", page: "map", icon: "pin" },
    { label: "System Reports", page: "system-reports", icon: "chart" },
    { label: "Settings", page: "settings", icon: "settings" },
    { label: "Profile", page: "profile", icon: "user" },
  ],
}

const adminMenus: Record<
  AdminLevel,
  { label: string; page: Page; icon: string }[]
> = {
  1: [
    { label: "Dashboard", page: "dashboard", icon: "grid" },
    { label: "Reports", page: "reports", icon: "file" },
    { label: "Report Map", page: "map", icon: "pin" },
    { label: "Profile", page: "profile", icon: "user" },
  ],
  2: [
    { label: "Dashboard", page: "dashboard", icon: "grid" },
    { label: "Reports", page: "reports", icon: "file" },
    { label: "Report Map", page: "map", icon: "pin" },
    { label: "System Reports", page: "system-reports", icon: "chart" },
    { label: "Profile", page: "profile", icon: "user" },
  ],
  3: [
    { label: "Dashboard", page: "dashboard", icon: "grid" },
    { label: "Manage Admins", page: "admins", icon: "shield" },
    { label: "Residents", page: "residents", icon: "users" },
    { label: "Reports", page: "reports", icon: "file" },
    { label: "Report Map", page: "map", icon: "pin" },
    { label: "System Reports", page: "system-reports", icon: "chart" },
    { label: "Announcements", page: "announcements", icon: "megaphone" },
    { label: "Settings", page: "settings", icon: "settings" },
    { label: "Profile", page: "profile", icon: "user" },
  ],
}

const adminLevelNames: Record<AdminLevel, string> = {
  1: "Barangay Tanod",
  2: "Secretary",
  3: "Punong Barangay",
}

const DEVELOPER_ACCESS_PASSWORD = "dev-access-only"

const filipino: Record<string, string> = {
  Home: "Tahanan",
  About: "Tungkol",
  Announcements: "Mga Anunsyo",
  "Log in": "Mag-log in",
  "Get started": "Magsimula",
  Dashboard: "Dashboard",
  "Submit Concern": "Magsumite ng Alalahanin",
  "My Reports": "Mga Ulat Ko",
  "Report Map": "Mapa ng mga Ulat",
  Profile: "Profile",
  Reports: "Mga Ulat",
  Residents: "Mga Residente",
  "Manage Admins": "Pamahalaan ang mga Admin",
  "System Reports": "Mga Ulat ng Sistema",
  Settings: "Mga Setting",
  Workspace: "Lugar ng Trabaho",
  Resident: "Residente",
  "Barangay Admin": "Admin ng Barangay",
  "Super Admin": "Super Admin",
  "Log out": "Mag-log out",
  "Better together.": "Mas mabuti kapag nagtutulungan.",
  "Every concern shared helps build a stronger community.":
    "Bawat alalahaning ibinabahagi ay tumutulong sa mas matatag na komunidad.",
  "Report Details": "Detalye ng Ulat",
  "A better way to stay connected": "Mas mabuting paraan upang manatiling konektado",
  "Connect with your": "Makipag-ugnayan sa iyong",
  "Report community concerns, track your requests, and stay updated with your barangay.":
    "Iulat ang mga alalahanin ng komunidad, subaybayan ang iyong mga kahilingan, at manatiling may alam sa iyong barangay.",
  "Report a concern": "Mag-ulat ng alalahanin",
  "Log in to your account": "Mag-log in sa iyong account",
  "Built for neighbors, by neighbors.": "Ginawa para sa kapitbahay, ng mga kapitbahay.",
  "Making every voice count.": "Mahalaga ang bawat tinig.",
  "Concern resolved": "Nalutas na ang alalahanin",
  "Just now · Zone 2": "Ngayon lang · Zone 2",
  "Stronger together": "Mas matatag kapag sama-sama",
  "A community that cares": "Komunidad na nagmamalasakit",
  "HOW IT WORKS": "PAANO ITO GUMAGANA",
  "Good things happen when": "May mabuting nangyayari kapag",
  "we stay connected.": "nananatili tayong konektado.",
  "Simple tools to help you make a difference in your neighborhood.":
    "Mga simpleng kasangkapan upang makatulong kang gumawa ng pagbabago sa inyong lugar.",
  "Track your report": "Subaybayan ang iyong ulat",
  "Stay updated": "Manatiling may alam",
  "See announcements": "Tingnan ang mga anunsyo",
  "Read more": "Magbasa pa",
  "FROM YOUR BARANGAY": "MULA SA IYONG BARANGAY",
  "What’s happening": "Ano ang nangyayari",
  "around you.": "sa paligid mo.",
  "The latest news and notices from your community.":
    "Pinakabagong balita at abiso mula sa iyong komunidad.",
  "A PLACE FOR EVERY VOICE": "LUGAR PARA SA BAWAT TINIG",
  "Join your community": "Sumali sa iyong komunidad",
  "Connecting people. Strengthening communities.":
    "Pinag-uugnay ang mga tao. Pinatatatag ang mga komunidad.",
  "Back to home": "Bumalik sa tahanan",
  "WELCOME BACK": "MALIGAYANG PAGBALIK",
  "Good to see you": "Mabuti at narito kang",
  "again.": "muli.",
  "Log in to stay connected with your community.":
    "Mag-log in upang manatiling konektado sa iyong komunidad.",
  "Email address": "Email address",
  Password: "Password",
  "Enter your password": "Ilagay ang iyong password",
  "Forgot password?": "Nakalimutan ang password?",
  "Create an account": "Gumawa ng account",
  "Full name": "Buong pangalan",
  "Contact number": "Numero ng telepono",
  Address: "Tirahan",
  "Confirm password": "Kumpirmahin ang password",
  "Create account": "Gumawa ng account",
  "Already have an account?": "May account ka na?",
  "Welcome back,": "Maligayang pagbabalik,",
  "Here’s what’s happening with your community concerns.":
    "Narito ang kalagayan ng iyong mga alalahanin sa komunidad.",
  Pending: "Nakabinbin",
  "Under Review": "Sinusuri",
  "In Progress": "Isinasagawa",
  Resolved: "Nalutas",
  Rejected: "Tinanggihan",
  Active: "Aktibo",
  Inactive: "Hindi aktibo",
  "Recent reports": "Mga kamakailang ulat",
  "View all": "Tingnan lahat",
  "Community notes": "Mga tala ng komunidad",
  "Latest from your barangay.": "Pinakabago mula sa iyong barangay.",
  "See all announcements": "Tingnan lahat ng anunsyo",
  "Total Residents": "Kabuuang Residente",
  "New Reports": "Mga Bagong Ulat",
  "Pending Reports": "Mga Nakabinbing Ulat",
  "Resolved Reports": "Mga Nalutas na Ulat",
  "Total Admins": "Kabuuang Admin",
  "Total Reports": "Kabuuang Ulat",
  "Manage reports": "Pamahalaan ang mga ulat",
  "Add admin": "Magdagdag ng admin",
  "Barangay Admin Dashboard": "Dashboard ng Admin ng Barangay",
  "Manage concerns and keep your community moving forward.":
    "Pamahalaan ang mga alalahanin at tulungang umunlad ang iyong komunidad.",
  "BarangayConnect Super Admin": "Super Admin ng BarangayConnect",
  "A clear view of your entire community network.":
    "Malinaw na tanaw sa buong network ng iyong komunidad.",
  "Report map": "Mapa ng mga ulat",
  "See where your concerns were reported. Select a pin to view its progress.":
    "Tingnan kung saan iniulat ang iyong mga alalahanin. Pumili ng pin upang makita ang progreso.",
  "Explore reported concerns in Jose Panganiban, Camarines Norte. Select a pin to see the details.":
    "Tuklasin ang mga iniulat na alalahanin sa Jose Panganiban, Camarines Norte. Pumili ng pin upang makita ang detalye.",
  "All statuses": "Lahat ng katayuan",
  "All categories": "Lahat ng kategorya",
  "Selected concern": "Napiling alalahanin",
  "View details": "Tingnan ang detalye",
  "Concern details": "Detalye ng alalahanin",
  "Concern title": "Pamagat ng alalahanin",
  Category: "Kategorya",
  Location: "Lokasyon",
  Description: "Paglalarawan",
  "Select a category": "Pumili ng kategorya",
  "Pin the location": "Ituro ang lokasyon",
  "No location pinned yet": "Wala pang lokasyong napili",
  "Upload photo": "Mag-upload ng larawan",
  "Click to upload a photo": "Pindutin upang mag-upload ng larawan",
  "Submit report": "Isumite ang ulat",
  Cancel: "Kanselahin",
  "New report": "Bagong ulat",
  "My reports": "Mga ulat ko",
  "See every concern you’ve shared, all in one place.":
    "Tingnan sa iisang lugar ang lahat ng alalahaning ibinahagi mo.",
  "Review, track, and respond to concerns from your community.":
    "Suriin, subaybayan, at tugunan ang mga alalahanin ng iyong komunidad.",
  Search: "Maghanap",
  Filter: "Salain",
  "Report ID": "ID ng Ulat",
  Concern: "Alalahanin",
  Date: "Petsa",
  Priority: "Prayoridad",
  Status: "Katayuan",
  Action: "Aksyon",
  View: "Tingnan",
  "Back to reports": "Bumalik sa mga ulat",
  "Date submitted": "Petsa ng pagsumite",
  "Uploaded photo": "Larawang in-upload",
  "No photo attached": "Walang kalakip na larawan",
  "Barangay remarks": "Puna ng barangay",
  "Report progress": "Progreso ng ulat",
  Submitted: "Naisumite",
  Completed: "Tapos na",
  "Current stage": "Kasalukuyang yugto",
  Upcoming: "Susunod",
  "Update report": "I-update ang ulat",
  "Update status": "I-update ang katayuan",
  "Admin remarks": "Puna ng admin",
  "Save update": "I-save ang update",
  "New announcement": "Bagong anunsyo",
  "News, events, and updates from your barangay.":
    "Mga balita, kaganapan, at update mula sa iyong barangay.",
  Remove: "Alisin",
  Name: "Pangalan",
  Email: "Email",
  Contact: "Kontak",
  "Manage admins": "Pamahalaan ang mga admin",
  "View and manage registered community members.":
    "Tingnan at pamahalaan ang mga rehistradong miyembro ng komunidad.",
  "Manage the people who support your barangay communities.":
    "Pamahalaan ang mga taong sumusuporta sa mga komunidad ng barangay.",
  "System reports": "Mga ulat ng sistema",
  "A simple overview of community concerns across the system.":
    "Simpleng buod ng mga alalahanin ng komunidad sa buong sistema.",
  "Barangay information": "Impormasyon ng barangay",
  "System settings": "Mga setting ng sistema",
  "Manage your barangay information and basic system preferences.":
    "Pamahalaan ang impormasyon ng barangay at mga pangunahing kagustuhan ng sistema.",
  "My profile": "Aking profile",
  "Your personal details, all in one place.":
    "Lahat ng iyong personal na detalye sa iisang lugar.",
  "Personal information": "Personal na impormasyon",
  "Keep your contact information up to date.":
    "Panatilihing napapanahon ang iyong impormasyon sa pakikipag-ugnayan.",
  "Save changes": "I-save ang mga pagbabago",
  "Edit profile": "I-edit ang profile",
  Close: "Isara",
  "Change password": "Palitan ang password",
  "Save password": "I-save ang password",
  "Light mode": "Maliwanag na mode",
  "Dark mode": "Madilim na mode",
  English: "Ingles",
  Filipino: "Filipino",
}

const PreferencesContext = createContext<{
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
}>({
  theme: "light",
  language: "en",
  setTheme: () => undefined,
  setLanguage: () => undefined,
})

function usePreferences() {
  return useContext(PreferencesContext)
}

function translate(value: string, language: Language) {
  return language === "fil" ? filipino[value] || value : value
}

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: string
  size?: number
  strokeWidth?: number
}) {
  const paths: Record<string, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    back: (
      <>
        <path d="M19 12H5m6 6-6-6 6-6" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    plusSquare: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M12 8v8m-4-4h8" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8m-8 4h6" />
      </>
    ),
    megaphone: (
      <>
        <path d="m3 11 16-6v14L3 13v-2Zm0 2 2 7h4l-2-6m12-6a3 3 0 0 1 0 8" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2H3Zm14-15a3 3 0 0 1 0 6m4 9v-2a6 6 0 0 0-4-5.65" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 9 4v6c0 5-3.4 8.7-9 10-5.6-1.3-9-5-9-10V6l9-4Z" />
        <path d="M9 12h6m-3-3v6" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18M7 16l4-5 3 2 5-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.8 1.8 0 0 0 .4 2l-1.6 1.6a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.2 1.7V21h-2.3v-1.1a1.8 1.8 0 0 0-1.2-1.7 1.8 1.8 0 0 0-2 .4L7.9 17a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.7-1.2H5.5v-2.3h1.1a1.8 1.8 0 0 0 1.7-1.2 1.8 1.8 0 0 0-.4-2L9.5 6.7a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 12.7 5V4h2.3v1.1a1.8 1.8 0 0 0 1.2 1.7 1.8 1.8 0 0 0 2-.4L19.8 8a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.2h1.1v2.3h-1.1a1.8 1.8 0 0 0-1.7 1.5Z"
          transform="translate(-1 -1) scale(.95)"
        />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
    filter: (
      <>
        <path d="M4 7h16M7 12h10m-7 5h4" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M5 5l14 14M19 5 5 19" />,
    edit: (
      <>
        <path d="m4 20 4.5-1 11-11a2 2 0 0 0-3-3l-11 11L4 20Zm10-13 3 3" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
      </>
    ),
    heart: (
      <path d="M20.8 8.5c0 5-8.8 11-8.8 11s-8.8-6-8.8-11a4.8 4.8 0 0 1 8.8-2.5 4.8 4.8 0 0 1 8.8 2.5Z" />
    ),
    spark: (
      <>
        <path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" />
        <path d="m19 19 .5 1.5L21 21l-1.5.5L19 23l-.5-1.5L17 21l1.5-.5L19 19Z" />
      </>
    ),
    external: (
      <>
        <path d="M13 5h6v6m0-6-9 9" />
        <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    moon: (
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    photo: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 16-5-5L5 21" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  )
}

function PreferenceControls() {
  const { theme, language, setTheme, setLanguage } = usePreferences()
  const dark = theme === "dark"

  return (
    <div className="preference-controls" aria-label="Display preferences">
      <button
        className="preference-button theme-button"
        onClick={() => setTheme(dark ? "light" : "dark")}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
      >
        <Icon name={dark ? "sun" : "moon"} size={17} />
      </button>
      <button
        className="preference-button language-button"
        onClick={() => setLanguage(language === "en" ? "fil" : "en")}
        aria-label={
          language === "en" ? "Gamitin ang Filipino" : "Switch to English"
        }
        title={language === "en" ? "Filipino" : "English"}
      >
        <Icon name="globe" size={16} />
        <span>{language === "en" ? "FIL" : "EN"}</span>
      </button>
    </div>
  )
}

function Logo({
  onClick,
  light = false,
}: {
  onClick: () => void
  light?: boolean
}) {
  return (
    <button
      className={`logo ${light ? "logo-light" : ""}`}
      onClick={onClick}
      aria-label="BarangayConnect home"
    >
      <span className="logo-mark">
        <span className="logo-roof" />
        <span className="logo-window" />
        <span className="logo-door" />
      </span>
      <span>
        barangay<span className="logo-emphasis">connect</span>
        <span className="logo-dot">.</span>
      </span>
    </button>
  )
}
function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  icon,
  disabled = false,
  className = "",
}: {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline" | "text" | "danger"
  type?: "button" | "submit"
  icon?: string
  disabled?: boolean
  className?: string
}) {
  const { language } = usePreferences()
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {typeof children === "string" ? translate(children, language) : children}
      {icon && <Icon name={icon} size={17} />}
    </button>
  )
}
function Badge({ status }: { status: string }) {
  const { language } = usePreferences()
  return (
    <span className={`badge badge-${status.toLowerCase().replace(/ /g, "-")}`}>
      <span className="badge-dot" />
      {translate(status, language)}
    </span>
  )
}
function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  defaultValue,
  pattern,
  maxLength,
  inputMode,
  title,
  children,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  pattern?: string
  maxLength?: number
  inputMode?: "email" | "numeric" | "tel" | "text"
  title?: string
  children?: ReactNode
}) {
  const { language } = usePreferences()
  return (
    <label className="field">
      <span className="field-label">
        {translate(label, language)}
        {required && <span className="required"> *</span>}
      </span>
      {children || (
        <input
          name={name}
          type={type}
          placeholder={placeholder ? translate(placeholder, language) : undefined}
          required={required}
          defaultValue={defaultValue}
          pattern={pattern}
          maxLength={maxLength}
          inputMode={inputMode}
          title={title}
        />
      )}
    </label>
  )
}
function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  const { language } = usePreferences()
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{translate(eyebrow, language)}</div>
        <h1>{translate(title, language)}</h1>
        {description && <p>{translate(description, language)}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  )
}
function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  const { language } = usePreferences()
  return (
    <div className="section-title">
      <div>
        <h2>{translate(title, language)}</h2>
        {subtitle && <p>{translate(subtitle, language)}</p>}
      </div>
      {action}
    </div>
  )
}
function Empty({ message }: { message: string }) {
  const { language } = usePreferences()
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="file" size={25} />
      </span>
      <h3>{language === "fil" ? "Wala pa rito" : "Nothing here yet"}</h3>
      <p>{translate(message, language)}</p>
    </div>
  )
}

const JOSE_PANGANIBAN: L.LatLngTuple = [14.2903434, 122.691494]

function NeighborhoodMap({
  markers = [],
  selectedId,
  onSelect,
  draft,
  onPick,
  zoom = 15,
}: {
  markers?: Report[]
  selectedId?: string
  onSelect?: (id: string) => void
  draft?: MapPosition | null
  onPick?: (position: MapPosition) => void
  zoom?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, {
      zoomControl: Boolean(onPickRef.current),
      scrollWheelZoom: true,
    }).setView(JOSE_PANGANIBAN, zoom)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    map.on("click", (event: L.LeafletMouseEvent) => {
      onPickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    })
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (mapRef.current && mapRef.current.getZoom() !== zoom) {
      mapRef.current.setZoom(zoom)
    }
  }, [zoom])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    markers.forEach((report) => {
      const status = report.status.toLowerCase().replace(/ /g, "-")
      const selected = selectedId === report.id ? " real-map-pin-selected" : ""
      const icon = L.divIcon({
        className: "real-map-marker-wrap",
        html: `<span class="real-map-pin real-map-pin-${status}${selected}"><span class="real-map-pin-center"></span></span>`,
        iconSize: [32, 42],
        iconAnchor: [16, 40],
      })
      const marker = L.marker([report.position.lat, report.position.lng], {
        icon,
        title: `${report.title}, ${report.status}`,
      }).addTo(layer)
      marker.on("click", () => onSelect?.(report.id))
      const label = document.createElement("span")
      label.textContent = report.title
      marker.bindTooltip(label)
    })
    if (draft) {
      L.marker([draft.lat, draft.lng], {
        icon: L.divIcon({
          className: "real-map-marker-wrap",
          html: '<span class="real-map-pin real-map-pin-draft"><span class="real-map-pin-center"></span></span>',
          iconSize: [32, 42],
          iconAnchor: [16, 40],
        }),
        interactive: false,
      }).addTo(layer)
    }
  }, [markers, selectedId, onSelect, draft])

  useEffect(() => {
    const report = markers.find((item) => item.id === selectedId)
    if (report) mapRef.current?.panTo([report.position.lat, report.position.lng])
  }, [selectedId])

  return (
    <div className="neighborhood-map real-map">
      <div ref={containerRef} className="real-map-canvas" aria-label="Map of Jose Panganiban, Camarines Norte" />
      {onPick && (
        <div className="map-center-action">
          <Button
            variant="outline"
            icon="pin"
            onClick={() => {
              const center = mapRef.current?.getCenter()
              if (center) onPick({ lat: center.lat, lng: center.lng })
            }}
          >
            Pin map center
          </Button>
        </div>
      )}
    </div>
  )
}

function AppContent() {
  const { language } = usePreferences()
  const t = (value: string) => translate(value, language)
  const [page, setPage] = useState<Page>("home")
  const [role, setRole] = useState<Role | null>(null)
  const [adminLevel, setAdminLevel] = useState<AdminLevel | null>(null)
  const [name, setName] = useState("Maria Santos")
  const [email, setEmail] = useState("maria@example.com")
  const [contact, setContact] = useState("0917 123 4567")
  const [address, setAddress] = useState("24 Mabini Street, Zone 2")
  const [reports, setReports] = useState<Report[]>([])
  const [residents, setResidents] = useState<Person[]>([])
  const [admins, setAdmins] = useState<Person[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedReport, setSelectedReport] = useState("")
  const [draftPosition, setDraftPosition] = useState<MapPosition | null>(null)
  const [mapError, setMapError] = useState("")
  const [mapZoom, setMapZoom] = useState(15)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const [categoryFilter, setCategoryFilter] = useState("All categories")
  const [notice, setNotice] = useState("")
  const [modal, setModal] =
    useState<"admin" | "announcement" | "announcement-detail" | "password" | null>(
      null,
    )
  const [editingAdmin, setEditingAdmin] = useState<Person | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [publicMenuOpen, setPublicMenuOpen] = useState(false)
  const [profileEditing, setProfileEditing] = useState(false)
  const [settings, setSettings] = useState({
    barangay: "Jose Panganiban",
    address: "Jose Panganiban, Camarines Norte",
    contact: "(02) 8123 4567",
    email: "hello@barangayconnect.ph",
    system: "BarangayConnect",
    notifications: true,
    maintenance: false,
  })
  useEffect(() => {
    async function loadData() {
      try {
        const [reportData, residentData, adminData, announcementData] =
          await Promise.all([
            apiRequest<Report[]>("/reports"),
            apiRequest<Person[]>("/residents"),
            apiRequest<Person[]>("/admins"),
            apiRequest<Announcement[]>("/announcements"),
          ])

        setReports(reportData)
        setResidents(residentData)
        setAdmins(adminData)
        setAnnouncements(announcementData)
        setSelectedReport(reportData[0]?.id || "")
      } catch (error) {
        console.error("Could not load BarangayConnect data", error)
        setReports(initialReports)
        setResidents(initialResidents)
        setAdmins(initialAdmins)
        setAnnouncements(initialAnnouncements)
        setSelectedReport(initialReports[0]?.id || "")
        alert("Connected to the local demo backend failed. Showing saved sample data instead.")
      }
    }

    loadData()
  }, [])

  const report = reports.find((r) => r.id === selectedReport) || reports[0]
  const myReports = reports.filter((r) => r.resident === name)
  const visibleMapReports = role === "resident" ? myReports : reports
  const filteredMapReports = visibleMapReports.filter(
    (r) => statusFilter === "All statuses" || r.status === statusFilter,
  )
  const activeMapReport =
    filteredMapReports.find((r) => r.id === selectedReport) ||
    filteredMapReports[0]

  function navigate(next: Page) {
    if (next === "submit") {
      setDraftPosition(null)
      setMapError("")
    }
    setPublicMenuOpen(false)
    setPage(next)
    setNotice("")
    setSidebarOpen(false)
    setSearch("")
    setStatusFilter("All statuses")
    setCategoryFilter("All categories")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  function alert(message: string) {
    setNotice(message)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  function loginAs(
    nextRole: Role,
    nextName: string,
    nextEmail: string,
    nextAdminLevel: AdminLevel | null = null,
  ) {
    setRole(nextRole)
    setAdminLevel(nextRole === "admin" ? nextAdminLevel || 1 : null)
    setName(nextName)
    setEmail(nextEmail)
    setContact(nextRole === "resident" ? "0917 123 4567" : "0917 555 0101")
    setAddress(
      nextRole === "resident"
        ? "24 Mabini Street, Zone 2"
        : "Barangay San Isidro",
    )
    navigate("dashboard")
  }
  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const entered = String(data.get("email")).trim().toLowerCase()
    const enteredPassword = String(data.get("password"))
    if (entered === "superadmin@barangayconnect.ph") {
      if (enteredPassword !== DEVELOPER_ACCESS_PASSWORD) {
        alert("Developer access only. The supplied credentials are not valid.")
        return
      }
      loginAs("superadmin", "BarangayConnect Developer", entered)
    } else {
      const administrator = admins.find(
        (a) => a.email.toLowerCase() === entered && a.status === "Active",
      )
      const person = residents.find(
        (r) => r.email.toLowerCase() === entered && r.status === "Active",
      )
      if (administrator) {
        loginAs(
          "admin",
          administrator.name,
          entered,
          administrator.level || 1,
        )
        setContact(administrator.contact)
        setAddress(administrator.address)
      } else if (person) {
        loginAs("resident", person.name, entered)
        setContact(person.contact)
        setAddress(person.address)
      } else
        alert(
          "Account not found. Create a resident account or try one of the demo roles below.",
        )
    }
  }
  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const registrationEmail = String(data.get("email")).trim().toLowerCase()
    const registrationContact = String(data.get("contact")).trim()
    if (!/^[a-z0-9._%+-]+@gmail\.com$/i.test(registrationEmail)) {
      alert("Please use a valid Gmail address ending in @gmail.com.")
      return
    }
    if (!/^\d{11}$/.test(registrationContact)) {
      alert("Contact number must contain exactly 11 digits.")
      return
    }
    if (data.get("password") !== data.get("confirm")) {
      alert("Passwords do not match. Please try again.")
      return
    }
    const person: Person = {
      id: `RES-${String(residents.length + 1).padStart(3, "0")}`,
      name: String(data.get("name")),
      email: registrationEmail,
      contact: registrationContact,
      address: String(data.get("address")),
      status: "Active",
    }

    try {
      const savedPerson = await apiRequest<Person>("/residents", {
        method: "POST",
        body: JSON.stringify(person),
      })
      setResidents((current) => [savedPerson, ...current])
      loginAs("resident", savedPerson.name, savedPerson.email)
      setContact(savedPerson.contact)
      setAddress(savedPerson.address)
      setNotice("Your account has been created. Welcome to BarangayConnect!")
    } catch (error) {
      console.error("Unable to create resident account", error)
      setResidents((current) => [person, ...current])
      loginAs("resident", person.name, person.email)
      setContact(person.contact)
      setAddress(person.address)
      setNotice("Your account has been created. Welcome to BarangayConnect!")
    }
  }
  async function submitConcern(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!draftPosition) {
      setMapError("Choose a spot on the map to place your report pin.")
      return
    }
    const data = new FormData(e.currentTarget)
    const photo = data.get("photo")
    const newReport: Report = {
      id: `BC-2025-${String(42 + reports.length - initialReports.length).padStart(3, "0")}`,
      title: String(data.get("title")),
      category: String(data.get("category")),
      description: String(data.get("description")),
      location: String(data.get("location")),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "Pending",
      resident: name,
      priority: "Medium",
      remarks: "",
      position: draftPosition,
      photo:
        photo instanceof File && photo.size
          ? URL.createObjectURL(photo)
          : undefined,
    }

    try {
      const savedReport = await apiRequest<Report>("/reports", {
        method: "POST",
        body: JSON.stringify(newReport),
      })
      setReports((current) => [savedReport, ...current])
      setSelectedReport(savedReport.id)
    } catch (error) {
      console.error("Could not save report to backend", error)
      setReports((current) => [newReport, ...current])
      setSelectedReport(newReport.id)
    }

    setDraftPosition(null)
    navigate("map")
    setNotice("Your concern has been submitted successfully.")
  }
  async function updateReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const nextStatus = String(data.get("status")) as Status
    const nextRemarks = String(data.get("remarks"))

    try {
      const updatedReport = await apiRequest<Report>(`/reports/${selectedReport}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, remarks: nextRemarks }),
      })
      setReports((current) =>
        current.map((r) => (r.id === selectedReport ? updatedReport : r)),
      )
      alert("Report update saved successfully.")
      return
    } catch (error) {
      console.error("Could not update report", error)
    }

    setReports((current) =>
      current.map((r) =>
        r.id === selectedReport
          ? {
              ...r,
              status: nextStatus,
              remarks: nextRemarks,
            }
          : r,
      ),
    )
    alert("Report update saved successfully.")
  }
  async function saveAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const person: Person = {
      id:
        editingAdmin?.id || `ADM-${String(admins.length + 1).padStart(3, "0")}`,
      name: String(data.get("name")),
      email: String(data.get("email")),
      contact: String(data.get("contact")),
      address: String(data.get("address")),
      level: Number(data.get("level") || editingAdmin?.level || 1) as AdminLevel,
      status: editingAdmin?.status || "Active",
      date:
        editingAdmin?.date ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    }

    try {
      const endpoint = editingAdmin ? `/admins/${editingAdmin.id}` : "/admins"
      const method = editingAdmin ? "PUT" : "POST"
      const savedAdmin = await apiRequest<Person>(endpoint, {
        method,
        body: JSON.stringify(person),
      })
      setAdmins((current) =>
        editingAdmin
          ? current.map((a) => (a.id === savedAdmin.id ? savedAdmin : a))
          : [savedAdmin, ...current],
      )
    } catch (error) {
      console.error("Could not save admin", error)
      setAdmins((current) =>
        editingAdmin
          ? current.map((a) => (a.id === person.id ? person : a))
          : [person, ...current],
      )
    }

    setModal(null)
    setEditingAdmin(null)
    alert(
      editingAdmin ? "Admin details updated." : "New admin account created.",
    )
  }
  async function saveAnnouncement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const newAnnouncement = {
      id: Date.now(),
      title: String(data.get("title")),
      category: String(data.get("category")),
      description: String(data.get("description")),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }

    try {
      const savedAnnouncement = await apiRequest<Announcement>("/announcements", {
        method: "POST",
        body: JSON.stringify(newAnnouncement),
      })
      setAnnouncements((current) => [savedAnnouncement, ...current])
    } catch (error) {
      console.error("Could not save announcement", error)
      setAnnouncements((current) => [newAnnouncement, ...current])
    }

    setModal(null)
    alert("Announcement published successfully.")
  }
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const nextName = String(data.get("name"))
    const nextEmail = String(data.get("email"))
    const nextContact = String(data.get("contact"))
    const nextAddress = String(data.get("address"))
    if (role === "resident") {
      const currentResident = residents.find((r) => r.email === email)
      if (currentResident) {
        try {
          const updatedResident = await apiRequest<Person>(`/residents/${currentResident.id}`, {
            method: "PUT",
            body: JSON.stringify({
              ...currentResident,
              name: nextName,
              email: nextEmail,
              contact: nextContact,
              address: nextAddress,
            }),
          })
          setResidents((current) =>
            current.map((r) => (r.id === currentResident.id ? updatedResident : r)),
          )
        } catch (error) {
          console.error("Could not update resident profile", error)
          setResidents((current) =>
            current.map((r) =>
              r.email === email
                ? {
                    ...r,
                    name: nextName,
                    email: nextEmail,
                    contact: nextContact,
                    address: nextAddress,
                  }
                : r,
            ),
          )
        }
      }
      setReports((current) =>
        current.map((r) =>
          r.resident === name ? { ...r, resident: nextName } : r,
        ),
      )
    }
    setName(nextName)
    setEmail(nextEmail)
    setContact(nextContact)
    setAddress(nextAddress)
    setProfileEditing(false)
    alert("Profile changes saved successfully.")
  }
  function viewReport(id: string) {
    setSelectedReport(id)
    navigate("report-detail")
  }
  function exportReports() {
    const rows = [
      ["Report ID", "Resident", "Concern", "Category", "Date", "Status"],
      ...reports.map((r) => [
        r.id,
        r.resident,
        r.title,
        r.category,
        r.date,
        r.status,
      ]),
    ]
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "barangayconnect-reports.csv"
    link.click()
    URL.revokeObjectURL(url)
  }
  const filteredReports = (role === "resident" ? myReports : reports).filter(
    (r) =>
      `${r.id} ${r.title} ${r.resident} ${r.category}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (statusFilter === "All statuses" || r.status === statusFilter) &&
      (categoryFilter === "All categories" || r.category === categoryFilter),
  )

  function reportTable(rows: Report[], mode: "resident" | "admin" = "admin") {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("Report ID")}</th>
              {mode === "admin" && <th>{t("Resident")}</th>}
              <th>{t("Concern")}</th>
              <th>{t("Category")}</th>
              <th>{t("Date")}</th>
              {mode === "admin" && <th>{t("Priority")}</th>}
              <th>{t("Status")}</th>
              <th className="align-right">{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="table-id">{r.id}</td>
                {mode === "admin" && <td>{r.resident}</td>}
                <td className="table-strong">{r.title}</td>
                <td>{r.category}</td>
                <td>{r.date}</td>
                {mode === "admin" && (
                  <td>
                    <span
                      className={`priority priority-${r.priority.toLowerCase()}`}
                    >
                      {r.priority}
                    </span>
                  </td>
                )}
                <td>
                  <Badge status={r.status} />
                </td>
                <td className="align-right">
                  <button
                    className="table-link"
                    onClick={() => viewReport(r.id)}
                  >
                    {t("View")} <Icon name="arrow" size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <Empty message="Try adjusting your search or filters." />
        )}
      </div>
    )
  }

  if (!role && (page === "home" || page === "login" || page === "register"))
    return (
      <div className="public-site">
        <header className="public-header">
          <div className="public-nav container">
            <Logo onClick={() => navigate("home")} />
            <nav className="desktop-nav" aria-label="Main navigation">
              <button
                onClick={() => navigate("home")}
                className={page === "home" ? "active" : ""}
              >
                {t("Home")}
              </button>
              <button
                onClick={() => {
                  navigate("home")
                  setTimeout(
                    () =>
                      document
                        .getElementById("about")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    50,
                  )
                }}
              >
                {t("About")}
              </button>
              <button
                onClick={() => {
                  navigate("home")
                  setTimeout(
                    () =>
                      document
                        .getElementById("public-announcements")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    50,
                  )
                }}
              >
                {t("Announcements")}
              </button>
            </nav>
            <div className="nav-actions">
              <PreferenceControls />
              <button className="nav-login" onClick={() => navigate("login")}>
                {t("Log in")}
              </button>
              <Button onClick={() => navigate("register")} icon="arrow">
                Get started
              </Button>
              <button
                className="public-menu-trigger"
                onClick={() => setPublicMenuOpen(!publicMenuOpen)}
                aria-label="Open navigation"
                aria-expanded={publicMenuOpen}
              >
                <Icon name={publicMenuOpen ? "close" : "menu"} />
              </button>
            </div>
          </div>
          {publicMenuOpen && (
            <nav className="public-mobile-nav" aria-label="Mobile navigation">
              <button onClick={() => navigate("home")}>{t("Home")}</button>
              <button
                onClick={() => {
                  navigate("home")
                  setTimeout(
                    () =>
                      document
                        .getElementById("about")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    50,
                  )
                }}
              >
                {t("About")}
              </button>
              <button
                onClick={() => {
                  navigate("home")
                  setTimeout(
                    () =>
                      document
                        .getElementById("public-announcements")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    50,
                  )
                }}
              >
                {t("Announcements")}
              </button>
              <button onClick={() => navigate("login")}>{t("Log in")}</button>
            </nav>
          )}
        </header>
        {page === "home" ? (
          <>
            <main>
              <section className="hero container">
                <div className="hero-copy">
                  <div className="eyebrow hero-eyebrow">
                    <span className="tiny-star">✳</span>{" "}
                    {t("A better way to stay connected")}
                  </div>
                  <h1>
                    {t("Connect with your")}
                    <br />
                    <em>barangay.</em>
                  </h1>
                  <p>
                    {t(
                      "Report community concerns, track your requests, and stay updated with your barangay.",
                    )}
                  </p>
                  <div className="hero-actions">
                    <Button onClick={() => navigate("login")} icon="arrow">
                      Report a concern
                    </Button>
                    <Button variant="outline" onClick={() => navigate("login")}>
                      Log in to your account
                    </Button>
                  </div>
                  <div className="hero-trust">
                    <span className="avatar-stack">
                      <span>MS</span>
                      <span>JD</span>
                      <span>AR</span>
                    </span>
                    <span>
                      {t("Built for neighbors, by neighbors.")}
                      <br />
                      <strong>{t("Making every voice count.")}</strong>
                    </span>
                  </div>
                </div>
                <div
                  className="hero-art"
                  aria-label="Illustration of a connected neighborhood"
                  role="img"
                >
                  <div className="art-glow" />
                  <div className="art-grid" />
                  <div className="art-sun" />
                  <div className="art-cloud art-cloud-one" />
                  <div className="art-cloud art-cloud-two" />
                  <div className="art-hill art-hill-back" />
                  <div className="art-hill art-hill-front" />
                  <div className="art-house art-house-left">
                    <div className="house-roof" />
                    <div className="house-body">
                      <span />
                      <span />
                      <i />
                    </div>
                  </div>
                  <div className="art-house art-house-center">
                    <div className="house-roof" />
                    <div className="house-body">
                      <span />
                      <span />
                      <i />
                    </div>
                  </div>
                  <div className="art-house art-house-right">
                    <div className="house-roof" />
                    <div className="house-body">
                      <span />
                      <span />
                      <i />
                    </div>
                  </div>
                  <div className="art-tree tree-one">
                    <i />
                    <span />
                  </div>
                  <div className="art-tree tree-two">
                    <i />
                    <span />
                  </div>
                  <div className="art-path" />
                  <div className="art-float art-float-top">
                    <span className="float-icon">
                      <Icon name="check" size={18} />
                    </span>
                    <div>
                      <strong>{t("Concern resolved")}</strong>
                      <small>{t("Just now · Zone 2")}</small>
                    </div>
                  </div>
                  <div className="art-float art-float-bottom">
                    <span className="float-icon yellow">
                      <Icon name="megaphone" size={17} />
                    </span>
                    <div>
                      <strong>{t("Stronger together")}</strong>
                      <small>{t("A community that cares")}</small>
                    </div>
                  </div>
                </div>
              </section>
              <section id="about" className="features-section">
                <div className="container">
                  <div className="section-intro">
                    <div className="eyebrow">{t("HOW IT WORKS")}</div>
                    <h2>
                      {t("Good things happen when")}
                      <br />
                      <em>{t("we stay connected.")}</em>
                    </h2>
                    <p>
                      {t(
                        "Simple tools to help you make a difference in your neighborhood.",
                      )}
                    </p>
                  </div>
                  <div className="feature-grid">
                    <div className="feature-card">
                      <div className="feature-icon">
                        <Icon name="plusSquare" size={26} />
                      </div>
                      <span className="feature-number">01 / SPEAK UP</span>
                      <h3>{t("Report a concern")}</h3>
                      <p>
                        See something that needs attention? Share it with your
                        barangay in just a few steps.
                      </p>
                      <button onClick={() => navigate("login")}>
                        Get started <Icon name="arrow" size={16} />
                      </button>
                    </div>
                    <div className="feature-card">
                      <div className="feature-icon">
                        <Icon name="chart" size={26} />
                      </div>
                      <span className="feature-number">02 / STAY INFORMED</span>
                      <h3>{t("Track your report")}</h3>
                      <p>
                        Follow the progress of your concern from submission to
                        resolution, every step of the way.
                      </p>
                      <button onClick={() => navigate("login")}>
                        Track a report <Icon name="arrow" size={16} />
                      </button>
                    </div>
                    <div className="feature-card">
                      <div className="feature-icon">
                        <Icon name="megaphone" size={26} />
                      </div>
                      <span className="feature-number">
                        03 / BE IN THE KNOW
                      </span>
                      <h3>{t("Stay updated")}</h3>
                      <p>
                        Never miss a community announcement, upcoming event, or
                        important local update.
                      </p>
                      <button
                        onClick={() =>
                          document
                            .getElementById("public-announcements")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                      >
                        See announcements <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <section
                id="public-announcements"
                className="public-updates container"
              >
                <div className="section-intro left">
                    <div className="eyebrow">{t("FROM YOUR BARANGAY")}</div>
                  <h2>
                      {t("What’s happening")} <em>{t("around you.")}</em>
                  </h2>
                <p>{t("The latest news and notices from your community.")}</p>
                </div>
                <div className="public-update-grid">
                  {announcements.slice(0, 2).map((a) => (
                    <article className="public-update" key={a.id}>
                      <span className="update-category">{a.category}</span>
                      <h3>{a.title}</h3>
                      <p>{a.description}</p>
                      <div className="update-foot">
                        <span>
                          <Icon name="calendar" size={15} /> {a.date}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAnnouncement(a)
                            setModal("announcement-detail")
                          }}
                        >
                        {t("Read more")} <Icon name="arrow" size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="cta-band">
                <div className="container cta-inner">
                  <div>
                  <div className="eyebrow">{t("A PLACE FOR EVERY VOICE")}</div>
                    <h2>
                      Let's make our community
                      <br />
                      <em>better, together.</em>
                    </h2>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("register")}
                    icon="arrow"
                  >
                    Join your community
                  </Button>
                </div>
              </section>
            </main>
            <footer className="public-footer container">
              <Logo onClick={() => navigate("home")} />
              <span>{t("Connecting people. Strengthening communities.")}</span>
              <span>© 2025 BarangayConnect</span>
            </footer>
          </>
        ) : (
          <main className="auth-page">
            <div className="auth-side">
              <div className="auth-side-inner">
                <div className="eyebrow">YOUR COMMUNITY STARTS HERE</div>
                <h2>
                  Every voice makes
                  <br />a <em>difference.</em>
                </h2>
                <p>
                  A simple space for neighbors to connect, speak up, and build a
                  better barangay together.
                </p>
                <div className="auth-side-card">
                  <span className="auth-card-icon">
                    <Icon name="heart" size={22} />
                  </span>
                  <span>Small actions. Stronger communities.</span>
                </div>
              </div>
              <div className="auth-shape auth-shape-one" />
              <div className="auth-shape auth-shape-two" />
            </div>
            <div className="auth-form-wrap">
              <div className="auth-form-inner">
                <button className="back-link" onClick={() => navigate("home")}>
                  <Icon name="back" size={17} /> {t("Back to home")}
                </button>
                {page === "login" ? (
                  <>
                    <div className="eyebrow">{t("WELCOME BACK")}</div>
                    <h1>
                      {t("Good to see you")} <em>{t("again.")}</em>
                    </h1>
                    <p className="auth-description">
                      {t("Log in to stay connected with your community.")}
                    </p>
                    {notice && (
                      <div className="inline-alert error">{notice}</div>
                    )}
                    <form onSubmit={handleLogin} className="stack-form">
                      <Field
                        label="Email address"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                      <Field
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="forgot-link"
                        onClick={() => setModal("password")}
                      >
                        {t("Forgot password?")}
                      </button>
                      <Button type="submit" className="full-width" icon="arrow">
                        Log in
                      </Button>
                    </form>
                    <div className="auth-switch">
                      New to BarangayConnect?{" "}
                      <button onClick={() => navigate("register")}>
                        Create an account
                      </button>
                    </div>
                    <div className="demo-logins">
                      <span className="demo-label">EXPLORE THE PROTOTYPE</span>
                      <p>
                        Try a role to see its workspace. Any password works.
                      </p>
                      <div className="demo-options">
                        <button
                          onClick={() =>
                            loginAs(
                              "resident",
                              "Maria Santos",
                              "maria@example.com",
                            )
                          }
                        >
                          <Icon name="user" size={17} /> Resident
                        </button>
                        <button
                          onClick={() =>
                            loginAs(
                              "admin",
                              "Elena Cruz",
                              "admin@barangayconnect.ph",
                              3,
                            )
                          }
                        >
                          <Icon name="users" size={17} /> Admin
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="eyebrow">JOIN YOUR COMMUNITY</div>
                    <h1>
                      Let’s get you <em>connected.</em>
                    </h1>
                    <p className="auth-description">
                      Create your resident account in just a moment.
                    </p>
                    <form onSubmit={handleRegister} className="stack-form">
                      <Field
                        label="Full name"
                        name="name"
                        placeholder="e.g. Maria Santos"
                        required
                      />
                      <Field
                        label="Email address"
                        name="email"
                        type="email"
                        placeholder="you@gmail.com"
                        pattern="[A-Za-z0-9._%+\-]+@gmail\.com"
                        title="Use a Gmail address ending in @gmail.com"
                        required
                      />
                      <Field
                        label="Contact number"
                        name="contact"
                        type="tel"
                        placeholder="09XXXXXXXXX"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        inputMode="numeric"
                        title="Enter exactly 11 digits"
                        required
                      />
                      <Field
                        label="Address"
                        name="address"
                        placeholder="House no., street, zone"
                        required
                      />
                      <div className="form-grid">
                        <Field
                          label="Password"
                          name="password"
                          type="password"
                          placeholder="Create password"
                          required
                        />
                        <Field
                          label="Confirm password"
                          name="confirm"
                          type="password"
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                      {notice && (
                        <div className="inline-alert error">{notice}</div>
                      )}
                      <Button type="submit" className="full-width" icon="arrow">
                        Create account
                      </Button>
                    </form>
                    <div className="auth-switch">
                      {t("Already have an account?")}{" "}
                      <button onClick={() => navigate("login")}>
                        {t("Log in")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        )}
        {modal === "password" && (
          <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
            <div
              className="modal-panel small"
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Reset password"
            >
              <button className="modal-close" onClick={() => setModal(null)}>
                <Icon name="close" />
              </button>
              <span className="modal-icon">
                <Icon name="lock" />
              </span>
              <h2>Reset your password</h2>
              <p>
                Enter your email address and we’ll help you get back into your
                account.
              </p>
              <form
                className="stack-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  setModal(null)
                  setNotice(
                    "Password reset request received. This is a prototype, so no email was sent.",
                  )
                }}
              >
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
                <Button type="submit" className="full-width">
                  Send reset link
                </Button>
              </form>
            </div>
          </div>
        )}
        {modal === "announcement-detail" && selectedAnnouncement && (
          <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
            <div
              className="modal-panel"
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={selectedAnnouncement.title}
            >
              <button className="modal-close" onClick={() => setModal(null)}>
                <Icon name="close" />
              </button>
              <span className="update-category">
                {selectedAnnouncement.category}
              </span>
              <h2>{selectedAnnouncement.title}</h2>
              <p className="muted">{selectedAnnouncement.date}</p>
              <p>{selectedAnnouncement.description}</p>
              <Button variant="outline" onClick={() => setModal(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    )

  if (!role) {
    navigate("home")
    return null
  }
  const activeRole = role
  const effectiveAdminLevel = adminLevel || 1
  const roleMenus =
    activeRole === "admin" ? adminMenus[effectiveAdminLevel] : menus[activeRole]
  const canManageBarangay =
    activeRole === "superadmin" ||
    (activeRole === "admin" && effectiveAdminLevel === 3)
  const canGenerateReports =
    activeRole === "superadmin" ||
    (activeRole === "admin" && effectiveAdminLevel >= 2)
  const allowed =
    roleMenus.some((item) => item.page === page) ||
    page === "report-detail"
  if (!allowed) {
    navigate("dashboard")
    return null
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo onClick={() => navigate("dashboard")} />
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-icon">
            <Icon
              name={
                role === "resident"
                  ? "heart"
                  : role === "admin"
                    ? "users"
                    : "shield"
              }
              size={18}
            />
          </span>
          <span>
            <strong>
              {role === "resident"
                ? t("Resident")
                : role === "admin"
                  ? adminLevelNames[effectiveAdminLevel]
                  : "Developer"}
            </strong>
            <small>
              {role === "admin"
                ? `Level ${effectiveAdminLevel} · ${t("Workspace")}`
                : t("Workspace")}
            </small>
          </span>
          <Icon name="chevron" size={15} />
        </div>
        <div className="sidebar-caption">{t("Workspace").toUpperCase()}</div>
        <nav className="side-nav" aria-label={`${role} navigation`}>
          {roleMenus.map((item) => (
            <button
              key={item.page}
              className={`side-link ${
                page === item.page ||
                (page === "report-detail" &&
                  (item.page === "my-reports" || item.page === "reports"))
                  ? "selected"
                  : ""
              }`}
              onClick={() => navigate(item.page)}
            >
              <Icon name={item.icon} size={19} />
              <span>{t(item.label)}</span>
              {(item.page === "reports" || item.page === "my-reports") && (
                <span className="nav-count">
                  {role === "resident" ? myReports.length : reports.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-symbol">
              <Icon name="spark" size={22} />
            </span>
            <strong>{t("Better together.")}</strong>
            <p>{t("Every concern shared helps build a stronger community.")}</p>
          </div>
          <button
            className="side-link logout-link"
            onClick={() => {
              setRole(null)
              setAdminLevel(null)
              setModal(null)
              navigate("home")
            }}
          >
            <Icon name="logout" size={19} /> <span>{t("Log out")}</span>
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb-parent">{t("Workspace")}</span>
            <Icon name="chevron" size={14} />
            <span className="breadcrumb-current">
              {page === "report-detail"
                ? t("Report Details")
                : t(
                    roleMenus.find((m) => m.page === page)?.label || "Dashboard",
                  )}
            </span>
          </div>
          <div className="topbar-right">
            <span className="today-date">
              <Icon name="calendar" size={16} />
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="topbar-divider" />
            <PreferenceControls />
            {roleMenus.some((item) => item.page === "announcements") && (
              <button
                className="topbar-bell"
                onClick={() => navigate("announcements")}
                title="Announcements"
              >
                <Icon name="bell" size={19} />
                <i />
              </button>
            )}
            <button
              className="topbar-profile"
              onClick={() => navigate("profile")}
              title="My profile"
            >
              <span className="avatar small-avatar">
                {name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span>{name.split(" ")[0]}</span>
              <Icon name="chevron" size={14} />
            </button>
          </div>
        </header>
        <main className="workspace-content">
          {notice && (
            <div className="inline-alert success" role="status">
              <Icon name="check" size={19} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <Icon name="close" size={17} />
              </button>
            </div>
          )}
          {page === "dashboard" && (
            <>
              {role === "resident" ? (
                <>
                  <div className="dashboard-hero resident-hero">
                    <div>
                      <div className="eyebrow">
                        {language === "fil"
                          ? "IYONG KOMUNIDAD, IYONG LUGAR"
                          : "YOUR COMMUNITY, YOUR SPACE"}
                      </div>
                      <h1>
                        {t("Welcome back,")} <em>{name.split(" ")[0]}.</em>
                      </h1>
                      <p>
                        {t(
                          "Here’s what’s happening with your community concerns.",
                        )}
                      </p>
                      <Button
                        variant="secondary"
                        icon="arrow"
                        onClick={() => navigate("submit")}
                      >
                        Report a concern
                      </Button>
                    </div>
                    <div className="dashboard-hero-art">
                      <span className="circle-a" />
                      <span className="circle-b" />
                      <span className="hero-art-icon">
                        <Icon name="heart" size={54} strokeWidth={1.2} />
                      </span>
                      <span className="spark-one">✳</span>
                      <span className="spark-two">✳</span>
                    </div>
                  </div>
                  <div className="stat-grid four">
                    {[
                      {
                        label: "My Reports",
                        value: myReports.length,
                        icon: "file",
                        tone: "green",
                      },
                      {
                        label: "Pending",
                        value: myReports.filter((r) => r.status === "Pending")
                          .length,
                        icon: "clock",
                        tone: "yellow",
                      },
                      {
                        label: "In Progress",
                        value: myReports.filter(
                          (r) =>
                            r.status === "In Progress" ||
                            r.status === "Under Review",
                        ).length,
                        icon: "chart",
                        tone: "blue",
                      },
                      {
                        label: "Resolved",
                        value: myReports.filter((r) => r.status === "Resolved")
                          .length,
                        icon: "check",
                        tone: "green",
                      },
                    ].map((s) => (
                      <StatCard key={s.label} {...s} />
                    ))}
                  </div>
                  <div className="dashboard-grid">
                    <div className="panel recent-panel">
                      <SectionTitle
                        title="Recent reports"
                        subtitle="Keep tabs on the concerns you’ve shared."
                        action={
                          <button
                            className="text-action"
                            onClick={() => navigate("my-reports")}
                          >
                            View all <Icon name="arrow" size={16} />
                          </button>
                        }
                      />
                      {reportTable(myReports.slice(0, 3), "resident")}
                    </div>
                    <div className="panel announcements-widget">
                      <SectionTitle
                        title="Community notes"
                        subtitle="Latest from your barangay."
                      />
                      {announcements.slice(0, 2).map((a) => (
                        <button
                          className="mini-announcement"
                          key={a.id}
                          onClick={() => {
                            setSelectedAnnouncement(a)
                            setModal("announcement-detail")
                          }}
                        >
                          <span className="mini-announcement-icon">
                            <Icon name="megaphone" size={18} />
                          </span>
                          <span>
                            <strong>{a.title}</strong>
                            <small>{a.date}</small>
                          </span>
                          <Icon name="chevron" size={16} />
                        </button>
                      ))}
                      <button
                        className="text-action widget-bottom"
                        onClick={() => navigate("announcements")}
                      >
                        See all announcements <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  </div>
                </>
              ) : role === "admin" ? (
                <>
                  <PageHeading
                    eyebrow="OVERVIEW / ADMIN"
                    title="Barangay Admin Dashboard"
                    description="Manage concerns and keep your community moving forward."
                    action={
                      <Button onClick={() => navigate("reports")} icon="arrow">
                        Manage reports
                      </Button>
                    }
                  />
                  <div className="stat-grid four">
                    {[
                      {
                        label: "Total Residents",
                        value: residents.length,
                        icon: "users",
                        tone: "green",
                      },
                      {
                        label: "New Reports",
                        value: reports.filter((r) => r.status === "Pending")
                          .length,
                        icon: "file",
                        tone: "blue",
                      },
                      {
                        label: "Pending Reports",
                        value: reports.filter(
                          (r) =>
                            r.status === "Pending" ||
                            r.status === "Under Review",
                        ).length,
                        icon: "clock",
                        tone: "yellow",
                      },
                      {
                        label: "Resolved Reports",
                        value: reports.filter((r) => r.status === "Resolved")
                          .length,
                        icon: "check",
                        tone: "green",
                      },
                    ].map((s) => (
                      <StatCard key={s.label} {...s} />
                    ))}
                  </div>
                  <div className="panel recent-panel">
                    <SectionTitle
                      title="Recent reports"
                      subtitle="The latest concerns submitted by residents."
                      action={
                        <button
                          className="text-action"
                          onClick={() => navigate("reports")}
                        >
                          View all reports <Icon name="arrow" size={16} />
                        </button>
                      }
                    />
                    {reportTable(reports.slice(0, 5))}
                  </div>
                </>
              ) : (
                <>
                  <PageHeading
                    eyebrow="OVERVIEW / SUPER ADMIN"
                    title="BarangayConnect Super Admin"
                    description="A clear view of your entire community network."
                    action={
                      <Button
                        onClick={() => {
                          setEditingAdmin(null)
                          setModal("admin")
                        }}
                        icon="plusSquare"
                      >
                        Add admin
                      </Button>
                    }
                  />
                  <div className="stat-grid four">
                    {[
                      {
                        label: "Total Admins",
                        value: admins.length,
                        icon: "shield",
                        tone: "green",
                      },
                      {
                        label: "Total Residents",
                        value: residents.length,
                        icon: "users",
                        tone: "blue",
                      },
                      {
                        label: "Total Reports",
                        value: reports.length,
                        icon: "file",
                        tone: "yellow",
                      },
                      {
                        label: "Resolved Reports",
                        value: reports.filter((r) => r.status === "Resolved")
                          .length,
                        icon: "check",
                        tone: "green",
                      },
                    ].map((s) => (
                      <StatCard key={s.label} {...s} />
                    ))}
                  </div>
                  <div className="dashboard-grid super-grid">
                    <div className="panel">
                      <SectionTitle
                        title="Reports overview"
                        subtitle="Where community concerns stand today."
                        action={
                          <button
                            className="text-action"
                            onClick={() => navigate("system-reports")}
                          >
                            Full report <Icon name="arrow" size={16} />
                          </button>
                        }
                      />
                      <div className="overview-layout">
                        <div
                          className="donut-chart"
                          style={{
                            background: `conic-gradient(#315e48 0 ${(reports.filter((r) => r.status === "Resolved").length / reports.length) * 100}%, #c9ad6c 0 ${(reports.filter((r) => r.status === "Resolved" || r.status === "Pending").length / reports.length) * 100}%, #8caab1 0 ${(reports.filter((r) => r.status !== "In Progress" && r.status !== "Rejected").length / reports.length) * 100}%, #a4765c 0)`,
                          }}
                        >
                          <div>
                            <strong>{reports.length}</strong>
                            <small>Total reports</small>
                          </div>
                        </div>
                        <div className="chart-legend">
                          {[
                            "Pending",
                            "Under Review",
                            "In Progress",
                            "Resolved",
                          ].map((s) => (
                            <div key={s}>
                              <span
                                className={`legend-dot legend-${s.toLowerCase().replace(/ /g, "-")}`}
                              />
                              <span>{s}</span>
                              <strong>
                                {reports.filter((r) => r.status === s).length}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="panel activity-panel">
                      <SectionTitle
                        title="Recent system activity"
                        subtitle="What’s new across the system."
                      />
                      <div className="activity-list">
                        {[
                          {
                            icon: "shield",
                            title: "New admin created",
                            detail: "Lea Garcia joined the team",
                            date: "May 22",
                          },
                          {
                            icon: "user",
                            title: "New resident registered",
                            detail: "A new neighbor joined",
                            date: "May 21",
                          },
                          {
                            icon: "file",
                            title: "New report submitted",
                            detail: "Streetlight concern received",
                            date: "May 21",
                          },
                          {
                            icon: "check",
                            title: "Report resolved",
                            detail: "Sidewalk concern closed",
                            date: "May 20",
                          },
                        ].map((a) => (
                          <div className="activity-item" key={a.title}>
                            <span className="activity-icon">
                              <Icon name={a.icon} size={17} />
                            </span>
                            <div>
                              <strong>{a.title}</strong>
                              <small>{a.detail}</small>
                            </div>
                            <time>{a.date}</time>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {page === "map" && (
            <>
              <PageHeading
                eyebrow="CONCERNS / LOCATIONS"
                title="Report map"
                description={
                  role === "resident"
                    ? "See where your concerns were reported. Select a pin to view its progress."
                    : "Explore reported concerns in Jose Panganiban, Camarines Norte. Select a pin to see the details."
                }
                action={
                  role === "resident" ? (
                    <Button
                      icon="plusSquare"
                      onClick={() => navigate("submit")}
                    >
                      Report a concern
                    </Button>
                  ) : undefined
                }
              />
              <div className="map-overview panel">
                <div className="map-overview-head">
                  <div>
                    <strong>Jose Panganiban, Camarines Norte</strong>
                    <span>
                      <Icon name="pin" size={14} /> {filteredMapReports.length}{" "}
                      mapped{" "}
                      {filteredMapReports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter map by status"
                  >
                    <option>All statuses</option>
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="map-main-stage">
                  <NeighborhoodMap
                    markers={filteredMapReports}
                    selectedId={activeMapReport?.id}
                    onSelect={setSelectedReport}
                    zoom={mapZoom}
                  />
                  <div
                    className="map-zoom-controls"
                    aria-label="Map zoom controls"
                  >
                    <button
                      onClick={() =>
                        setMapZoom(Math.min(19, mapZoom + 1))
                      }
                      disabled={mapZoom >= 19}
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <button
                      onClick={() =>
                        setMapZoom(Math.max(10, mapZoom - 1))
                      }
                      disabled={mapZoom <= 10}
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                  </div>
                </div>
                <div className="map-legend">
                  <span>
                    <i className="map-legend-dot pending" />
                    Pending
                  </span>
                  <span>
                    <i className="map-legend-dot progress" />
                    In progress
                  </span>
                  <span>
                    <i className="map-legend-dot resolved" />
                    Resolved
                  </span>
                  <span className="map-legend-help">
                    Demo report pins are approximate. New reports use the selected map location.
                  </span>
                </div>
              </div>
              <div className="map-results">
                <div className="panel map-selected-card">
                  <SectionTitle
                    title="Selected concern"
                    subtitle="A closer look at this location."
                  />
                  {activeMapReport ? (
                    <>
                      <span className="map-report-id">
                        {activeMapReport.id}
                      </span>
                      <h3>{activeMapReport.title}</h3>
                      <div className="map-selected-meta">
                        <Icon name="pin" size={16} />
                        {activeMapReport.location}
                      </div>
                      <div className="map-selected-bottom">
                        <Badge status={activeMapReport.status} />
                        <Button
                          variant="outline"
                          onClick={() => viewReport(activeMapReport.id)}
                          icon="arrow"
                        >
                          View details
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Empty message="No reports match this status yet." />
                  )}
                </div>
                <div className="panel map-list-card">
                  <SectionTitle
                    title={
                      role === "resident"
                        ? "My mapped reports"
                        : "Mapped reports"
                    }
                    subtitle="Select a report to locate its pin."
                  />
                  <div className="map-report-list">
                    {filteredMapReports.map((item) => (
                      <button
                        key={item.id}
                        className={`map-report-row ${
                          activeMapReport?.id === item.id ? "active" : ""
                        }`}
                        onClick={() => setSelectedReport(item.id)}
                      >
                        <span
                          className={`map-row-pin map-row-${item.status.toLowerCase().replace(/ /g, "-")}`}
                        >
                          <Icon name="pin" size={17} />
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.location}</small>
                        </span>
                        <Badge status={item.status} />
                      </button>
                    ))}
                    {filteredMapReports.length === 0 && (
                      <Empty message="Try another status to see more pins." />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {page === "submit" && role === "resident" && (
            <>
              <PageHeading
                eyebrow="MAKE YOUR VOICE HEARD"
                title="Report a concern"
                description="Tell us what’s happening. Your barangay is here to help."
              />
              <div className="form-layout">
                <div className="panel form-panel">
                  <SectionTitle
                    title="Concern details"
                    subtitle="Please provide as much detail as you can."
                  />
                  <form onSubmit={submitConcern} className="stack-form">
                    <Field
                      label="Concern title"
                      name="title"
                      placeholder="e.g. Broken streetlight on Mabini Street"
                      required
                    />
                    <div className="form-grid">
                      <Field label="Category" name="category" required>
                        <select name="category" required defaultValue="">
                          <option value="" disabled>
                            Select a category
                          </option>
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        label="Location"
                        name="location"
                        placeholder="Street, zone, or landmark"
                        required
                      />
                    </div>
                    <Field label="Description" name="description" required>
                      <textarea
                        name="description"
                        rows={5}
                        placeholder="Describe the concern and any useful details..."
                        required
                      />
                    </Field>
                    <div className="field">
                      <span className="field-label">
                        Pin the location <span className="required">*</span>
                      </span>
                      <p className="map-field-hint">
                        Find the location in Jose Panganiban, then tap the map to place your pin.
                        You can pan and zoom to pinpoint the spot. Your report will appear on the map when submitted.
                      </p>
                      <div className="map-picker">
                        <NeighborhoodMap
                          draft={draftPosition}
                          onPick={(position) => {
                            setDraftPosition(position)
                            setMapError("")
                          }}
                        />
                      </div>
                      <div
                        className={`map-picker-feedback ${
                          mapError ? "map-picker-error" : ""
                        }`}
                        role="status"
                      >
                        <Icon
                          name={draftPosition ? "check" : "pin"}
                          size={16}
                        />
                        {mapError ||
                          (draftPosition
                            ? "Location pinned. Tap the map again to move it."
                            : "No location pinned yet")}
                      </div>
                    </div>
                    <label className="field">
                      <span className="field-label">
                        Upload photo{" "}
                        <span className="optional">(optional)</span>
                      </span>
                      <span className="upload-box">
                        <Icon name="upload" size={25} />
                        <strong>Click to upload a photo</strong>
                        <small>JPG or PNG, up to 5 MB</small>
                        <input
                          type="file"
                          name="photo"
                          accept="image/png,image/jpeg"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f && f.size > 5 * 1024 * 1024) {
                              e.target.value = ""
                              alert("Please choose a photo under 5 MB.")
                            }
                          }}
                        />
                      </span>
                    </label>
                    <div className="form-actions">
                      <Button type="submit" icon="arrow">
                        Submit report
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => navigate("dashboard")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">
                    <Icon name="spark" size={22} />
                  </span>
                  <h3>A little detail goes a long way.</h3>
                  <p>
                    A clear description and location help your barangay team
                    understand and respond to your concern more quickly.
                  </p>
                  <div className="tip-divider" />
                  <span>
                    <Icon name="lock" size={16} /> Only you and barangay staff
                    can see your report.
                  </span>
                </div>
              </div>
            </>
          )}
          {(page === "my-reports" || page === "reports") && (
            <>
              <PageHeading
                eyebrow={
                  role === "resident" ? "YOUR CONCERNS" : "COMMUNITY CONCERNS"
                }
                title={role === "resident" ? "My reports" : "Manage reports"}
                description={
                  role === "resident"
                    ? "See every concern you’ve shared, all in one place."
                    : "Review, track, and respond to concerns from your community."
                }
                action={
                  role === "resident" ? (
                    <Button
                      onClick={() => navigate("submit")}
                      icon="plusSquare"
                    >
                      New report
                    </Button>
                  ) : undefined
                }
              />
              <div className="panel list-panel">
                <div className="list-toolbar">
                  <div className="search-box">
                    <Icon name="search" size={18} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={
                        role === "resident"
                          ? "Search your reports..."
                          : "Search reports or residents..."
                      }
                      aria-label="Search reports"
                    />
                  </div>
                  <div className="filter-group">
                    <span className="filter-label">
                      <Icon name="filter" size={17} /> Filter
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by status"
                    >
                      <option>All statuses</option>
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      aria-label="Filter by category"
                    >
                      <option>All categories</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {reportTable(
                  filteredReports,
                  role === "resident" ? "resident" : "admin",
                )}
                <div className="table-footer">
                  Showing {filteredReports.length} of{" "}
                  {role === "resident" ? myReports.length : reports.length}{" "}
                  reports
                </div>
              </div>
            </>
          )}
          {page === "report-detail" && (
            <>
              <button
                className="back-link detail-back"
                onClick={() =>
                  navigate(role === "resident" ? "my-reports" : "reports")
                }
              >
                <Icon name="back" size={17} /> Back to reports
              </button>
              <PageHeading
                eyebrow={`REPORT / ${report.id}`}
                title={report.title}
                description={`Submitted on ${report.date} by ${report.resident}`}
                action={<Badge status={report.status} />}
              />
              <div className="detail-grid">
                <div className="detail-main">
                  <div className="panel detail-panel">
                    <SectionTitle title="Concern details" />
                    <div className="detail-fields">
                      <div>
                        <span>Report ID</span>
                        <strong>{report.id}</strong>
                      </div>
                      <div>
                        <span>Category</span>
                        <strong>{report.category}</strong>
                      </div>
                      <div>
                        <span>Location</span>
                        <strong>{report.location}</strong>
                      </div>
                      <div>
                        <span>Date submitted</span>
                        <strong>{report.date}</strong>
                      </div>
                    </div>
                    <div className="detail-description">
                      <span>Description</span>
                      <p>{report.description}</p>
                    </div>
                    <div className="detail-description">
                      <span>Uploaded photo</span>
                      {report.photo ? (
                        <img
                          className="report-photo"
                          src={report.photo}
                          alt="Uploaded concern"
                        />
                      ) : (
                        <div className="no-photo">
                          <Icon name="photo" size={20} /> No photo attached
                        </div>
                      )}
                    </div>
                    <button
                      className="text-action detail-map-link"
                      onClick={() => navigate("map")}
                    >
                      <Icon name="pin" size={17} /> View this location on the
                      report map <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  <div className="panel remarks-panel">
                    <SectionTitle title="Barangay remarks" />
                    <div className="remarks-content">
                      <span className="remarks-avatar">
                        <Icon name="users" size={19} />
                      </span>
                      <p>
                        {report.remarks ||
                          "No remarks yet. Check back for updates from the barangay team."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="detail-aside">
                  {role === "resident" ? (
                    <div className="panel timeline-panel">
                      <SectionTitle
                        title="Report progress"
                        subtitle="Follow your concern’s journey."
                      />
                      <div className="timeline">
                        {([
                          "Submitted",
                          "Under Review",
                          "In Progress",
                          "Resolved",
                        ] as const).map((step, i) => {
                          const order = [
                            "Pending",
                            "Under Review",
                            "In Progress",
                            "Resolved",
                          ]
                          const current =
                            report.status === "Rejected"
                              ? 0
                              : order.indexOf(report.status)
                          return (
                            <div
                              className={`timeline-step ${
                                i <= current ? "done" : ""
                              }`}
                              key={step}
                            >
                              <span className="timeline-node">
                                {i <= current ? (
                                  <Icon name="check" size={14} />
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <div>
                                <strong>{step}</strong>
                                <small>
                                  {i === 0
                                    ? report.date
                                    : i < current
                                      ? "Completed"
                                      : i === current
                                        ? "Current stage"
                                        : "Upcoming"}
                                </small>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {report.status === "Rejected" && (
                        <div className="inline-alert error">
                          This report was not approved. See barangay remarks for
                          details.
                        </div>
                      )}
                    </div>
                  ) : canManageBarangay && role === "admin" ? (
                    <div className="panel update-panel">
                      <SectionTitle
                        title="Update report"
                        subtitle="Keep the resident informed."
                      />
                      <form onSubmit={updateReport} className="stack-form">
                        <Field label="Update status" name="status">
                          <select
                            name="status"
                            defaultValue={report.status}
                            key={report.id + report.status}
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Admin remarks" name="remarks">
                          <textarea
                            name="remarks"
                            rows={5}
                            defaultValue={report.remarks}
                            key={report.id + report.remarks}
                            placeholder="Write an update for the resident..."
                          />
                        </Field>
                        <Button type="submit" className="full-width">
                          Save update
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="tip-card">
                      <span className="tip-icon">
                        <Icon name="shield" size={22} />
                      </span>
                      <h3>
                        {role === "admin" ? "Read-only access" : "System oversight"}
                      </h3>
                      <p>
                        {role === "admin"
                          ? "Your admin level can view report details. Status updates are reserved for the Punong Barangay."
                          : "Developers can view all reports. Day-to-day status updates are managed by the Punong Barangay."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {page === "announcements" && (
            <>
              <PageHeading
                eyebrow="STAY IN THE KNOW"
                title="Announcements"
                description="News, events, and updates from your barangay."
                action={
                  role === "admin" ? (
                    <Button
                      icon="plusSquare"
                      onClick={() => setModal("announcement")}
                    >
                      New announcement
                    </Button>
                  ) : undefined
                }
              />
              <div className="announcement-grid">
                {announcements.map((a) => (
                  <article className="panel announcement-card" key={a.id}>
                    <span className="announcement-icon">
                      <Icon name="megaphone" size={23} />
                    </span>
                    <div className="announcement-meta">
                      <span className="update-category">{a.category}</span>
                      <span>
                        <Icon name="calendar" size={15} />
                        {a.date}
                      </span>
                    </div>
                    <h2>{a.title}</h2>
                    <p>{a.description}</p>
                    <button
                      className="text-action"
                      onClick={() => {
                        setSelectedAnnouncement(a)
                        setModal("announcement-detail")
                      }}
                    >
                      Read more <Icon name="arrow" size={16} />
                    </button>
                    {role === "admin" && (
                      <button
                        className="remove-link"
                        onClick={async () => {
                          if (window.confirm("Remove this announcement?")) {
                            try {
                              await apiRequest(`/announcements/${a.id}`, {
                                method: "DELETE",
                              })
                              setAnnouncements((current) =>
                                current.filter((item) => item.id !== a.id),
                              )
                              alert("Announcement removed.")
                            } catch (error) {
                              console.error("Could not remove announcement", error)
                              setAnnouncements((current) =>
                                current.filter((item) => item.id !== a.id),
                              )
                              alert("Announcement removed.")
                            }
                          }
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
          {page === "residents" && role !== "resident" && (
            <>
              <PageHeading
                eyebrow="PEOPLE / RESIDENTS"
                title="Residents"
                description="View and manage registered community members."
              />
              <div className="panel list-panel">
                <div className="list-toolbar">
                  <div className="search-box">
                    <Icon name="search" size={18} />
                    <input
                      placeholder="Search residents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search residents"
                    />
                  </div>
                  <span className="record-count">
                    {residents.length} residents
                  </span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Resident ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th className="align-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residents
                        .filter((r) =>
                          `${r.id} ${r.name} ${r.email}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((r) => (
                          <tr key={r.id}>
                            <td className="table-id">{r.id}</td>
                            <td className="table-strong">{r.name}</td>
                            <td>{r.email}</td>
                            <td>{r.contact}</td>
                            <td>{r.address}</td>
                            <td>
                              <Badge status={r.status} />
                            </td>
                            <td className="align-right">
                              <button
                                className="table-link"
                                onClick={() =>
                                  alert(
                                    `${r.name} · ${r.email} · ${r.contact} · ${r.address}`,
                                  )
                                }
                              >
                                View
                              </button>
                              <button
                                className="table-link subdued"
                                onClick={() => {
                                  setResidents(
                                    residents.map((p) =>
                                      p.id === r.id
                                        ? {
                                            ...p,
                                            status:
                                              p.status === "Active"
                                                ? "Inactive"
                                                : "Active",
                                          }
                                        : p,
                                    ),
                                  )
                                  alert(
                                    `Resident account ${
                                      r.status === "Active"
                                        ? "deactivated"
                                        : "activated"
                                    }.`,
                                  )
                                }}
                              >
                                {r.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {page === "admins" && canManageBarangay && (
            <>
              <PageHeading
                eyebrow="PEOPLE / ADMINISTRATORS"
                title="Manage admins"
                description="Manage the people who support your barangay communities."
                action={
                  <Button
                    icon="plusSquare"
                    onClick={() => {
                      setEditingAdmin(null)
                      setModal("admin")
                    }}
                  >
                    Add admin
                  </Button>
                }
              />
              <div className="panel list-panel">
                <div className="list-toolbar">
                  <div className="search-box">
                    <Icon name="search" size={18} />
                    <input
                      placeholder="Search admins..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search admins"
                    />
                  </div>
                  <span className="record-count">
                    {admins.length} administrators
                  </span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Admin ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Admin level</th>
                        <th>Barangay / Area</th>
                        <th>Status</th>
                        <th>Date Created</th>
                        <th className="align-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins
                        .filter((a) =>
                          `${a.id} ${a.name} ${a.email} ${a.address}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((a) => (
                          <tr key={a.id}>
                            <td className="table-id">{a.id}</td>
                            <td className="table-strong">{a.name}</td>
                            <td>{a.email}</td>
                            <td>
                              <span className="admin-level-label">
                                Level {a.level || 1} ·{" "}
                                {adminLevelNames[a.level || 1]}
                              </span>
                            </td>
                            <td>{a.address}</td>
                            <td>
                              <Badge status={a.status} />
                            </td>
                            <td>{a.date}</td>
                            <td className="align-right">
                              <button
                                className="table-link"
                                onClick={() => {
                                  setEditingAdmin(a)
                                  setModal("admin")
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="table-link subdued"
                                onClick={() => {
                                  setAdmins(
                                    admins.map((p) =>
                                      p.id === a.id
                                        ? {
                                            ...p,
                                            status:
                                              p.status === "Active"
                                                ? "Inactive"
                                                : "Active",
                                          }
                                        : p,
                                    ),
                                  )
                                  alert(
                                    `Admin account ${
                                      a.status === "Active"
                                        ? "deactivated"
                                        : "activated"
                                    }.`,
                                  )
                                }}
                              >
                                {a.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {page === "system-reports" && canGenerateReports && (
            <>
              <PageHeading
                eyebrow="INSIGHTS / SYSTEM REPORTS"
                title="System reports"
                description="A simple overview of community concerns across the system."
                action={
                  <Button icon="download" onClick={exportReports}>
                    Export report
                  </Button>
                }
              />
              <div className="stat-grid four">
                {[
                  {
                    label: "Total Reports",
                    value: reports.length,
                    icon: "file",
                    tone: "green",
                  },
                  {
                    label: "Pending",
                    value: reports.filter((r) => r.status === "Pending").length,
                    icon: "clock",
                    tone: "yellow",
                  },
                  {
                    label: "In Progress",
                    value: reports.filter((r) => r.status === "In Progress")
                      .length,
                    icon: "chart",
                    tone: "blue",
                  },
                  {
                    label: "Resolved",
                    value: reports.filter((r) => r.status === "Resolved")
                      .length,
                    icon: "check",
                    tone: "green",
                  },
                ].map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
              <div className="insight-grid">
                <div className="panel insight-panel">
                  <SectionTitle
                    title="Reports by category"
                    subtitle="What residents are reporting."
                  />
                  <div className="bar-list">
                    {categories.map((c) => {
                      const count = reports.filter(
                        (r) => r.category === c,
                      ).length
                      return (
                        <div className="bar-row" key={c}>
                          <span>{c}</span>
                          <div className="bar-track">
                            <div
                              style={{
                                width: `${
                                  reports.length
                                    ? (count / reports.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <strong>{count}</strong>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="panel insight-panel">
                  <SectionTitle
                    title="Reports by status"
                    subtitle="Progress at a glance."
                  />
                  <div className="bar-list">
                    {statuses.map((s) => {
                      const count = reports.filter((r) => r.status === s).length
                      return (
                        <div className="bar-row" key={s}>
                          <span>{s}</span>
                          <div className="bar-track">
                            <div
                              style={{
                                width: `${
                                  reports.length
                                    ? (count / reports.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <strong>{count}</strong>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="panel insight-panel month-panel">
                  <SectionTitle
                    title="Reports by month"
                    subtitle="Submission activity over time."
                  />
                  <div className="month-chart">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
                      (month, i) => {
                        const count = reports.filter((r) =>
                          r.date.startsWith(month),
                        ).length
                        return (
                          <div className="month-col" key={month}>
                            <div
                              className="month-bar"
                              style={{
                                height: `${Math.max(8, (count / Math.max(reports.length, 1)) * 100)}%`,
                              }}
                            />
                            <span>{month}</span>
                          </div>
                        )
                      },
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {page === "settings" && canManageBarangay && (
            <>
              <PageHeading
                eyebrow="SYSTEM / SETTINGS"
                title="Settings"
                description="Manage your barangay information and basic system preferences."
              />
              <form
                className="settings-layout"
                onSubmit={(e) => {
                  e.preventDefault()
                  const data = new FormData(e.currentTarget)
                  setSettings({
                    barangay: String(data.get("barangay")),
                    address: String(data.get("address")),
                    contact: String(data.get("contact")),
                    email: String(data.get("email")),
                    system: String(data.get("system")),
                    notifications: data.get("notifications") === "on",
                    maintenance: data.get("maintenance") === "on",
                  })
                  alert("System settings saved successfully.")
                }}
              >
                <div className="panel form-panel">
                  <SectionTitle
                    title="Barangay information"
                    subtitle="Public contact details for your community."
                  />
                  <div className="stack-form">
                    <Field
                      label="Barangay name"
                      name="barangay"
                      defaultValue={settings.barangay}
                      required
                    />
                    <Field
                      label="Address"
                      name="address"
                      defaultValue={settings.address}
                      required
                    />
                    <div className="form-grid">
                      <Field
                        label="Contact number"
                        name="contact"
                        defaultValue={settings.contact}
                      />
                      <Field
                        label="Email"
                        name="email"
                        type="email"
                        defaultValue={settings.email}
                      />
                    </div>
                  </div>
                </div>
                <div className="panel form-panel">
                  <SectionTitle
                    title="System settings"
                    subtitle="Keep things simple and running smoothly."
                  />
                  <div className="stack-form">
                    <Field
                      label="System name"
                      name="system"
                      defaultValue={settings.system}
                    />
                    <label className="toggle-row">
                      <span>
                        <strong>Email notifications</strong>
                        <small>Send updates when report statuses change.</small>
                      </span>
                      <input
                        type="checkbox"
                        name="notifications"
                        defaultChecked={settings.notifications}
                      />
                    </label>
                    <label className="toggle-row">
                      <span>
                        <strong>Maintenance mode</strong>
                        <small>Temporarily pause resident access.</small>
                      </span>
                      <input
                        type="checkbox"
                        name="maintenance"
                        defaultChecked={settings.maintenance}
                      />
                    </label>
                  </div>
                </div>
                <div className="settings-save">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </>
          )}
          {page === "profile" && (
            <>
              <PageHeading
                eyebrow="ACCOUNT / PROFILE"
                title="My profile"
                description="Your personal details, all in one place."
              />
              <div className="profile-layout">
                <div className="panel profile-card">
                  <div className="profile-cover" />
                  <span className="avatar profile-avatar">
                    {name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <h2>{name}</h2>
                  <p>
                    {role === "resident"
                      ? "Community Resident"
                      : role === "admin"
                        ? `Level ${effectiveAdminLevel} · ${adminLevelNames[effectiveAdminLevel]}`
                        : "Developer Administrator"}
                  </p>
                  <Badge status="Active" />
                  <div className="profile-divider" />
                  <div className="profile-id">
                    <span>
                      {role === "resident"
                        ? "Resident ID"
                        : role === "admin"
                          ? "Admin ID"
                          : "Account ID"}
                    </span>
                    <strong>
                      {role === "resident"
                        ? residents.find((r) => r.email === email)?.id ||
                          "RES-001"
                        : role === "admin"
                          ? "ADM-001"
                          : "SA-001"}
                    </strong>
                  </div>
                </div>
                <div className="panel form-panel">
                  <SectionTitle
                    title="Personal information"
                    subtitle="Keep your contact information up to date."
                    action={
                      !profileEditing && (
                        <Button
                          variant="outline"
                          icon="edit"
                          onClick={() => setProfileEditing(true)}
                        >
                          Edit profile
                        </Button>
                      )
                    }
                  />
                  <form onSubmit={saveProfile} className="stack-form">
                    <div className="form-grid">
                      <Field
                        label="Full name"
                        name="name"
                        defaultValue={name}
                        required
                      >
                        <input
                          name="name"
                          defaultValue={name}
                          required
                          disabled={!profileEditing}
                        />
                      </Field>
                      <Field
                        label="Email address"
                        name="email"
                        defaultValue={email}
                        required
                      >
                        <input
                          name="email"
                          type="email"
                          defaultValue={email}
                          required
                          disabled={!profileEditing}
                        />
                      </Field>
                      <Field label="Contact number" name="contact">
                        <input
                          name="contact"
                          defaultValue={contact}
                          disabled={!profileEditing}
                        />
                      </Field>
                      <Field
                        label={role === "resident" ? "Address" : "Role / Area"}
                        name="address"
                      >
                        <input
                          name="address"
                          defaultValue={address}
                          disabled={!profileEditing}
                        />
                      </Field>
                    </div>
                    {profileEditing && (
                      <div className="form-actions">
                        <Button type="submit">Save changes</Button>
                        <Button
                          variant="text"
                          onClick={() => setProfileEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    {role === "superadmin" && !profileEditing && (
                      <div className="profile-password">
                        <button
                          className="text-action"
                          onClick={() => setModal("password")}
                          type="button"
                        >
                          <Icon name="lock" size={17} /> Change password{" "}
                          <Icon name="arrow" size={16} />
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      {modal === "admin" && canManageBarangay && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div
            className="modal-panel"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editingAdmin ? "Edit admin" : "Add admin"}
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <div className="eyebrow">ADMIN MANAGEMENT</div>
            <h2>
              {editingAdmin ? "Edit administrator" : "Add an administrator"}
            </h2>
            <p>
              {editingAdmin
                ? "Update the details for this admin account."
                : "Create an account for a barangay administrator."}
            </p>
            <form className="stack-form" onSubmit={saveAdmin}>
              <Field
                label="Full name"
                name="name"
                defaultValue={editingAdmin?.name}
                required
              />
              <Field
                label="Email address"
                name="email"
                type="email"
                defaultValue={editingAdmin?.email}
                required
              />
              <Field label="Admin level" name="level" required>
                <select
                  name="level"
                  defaultValue={String(editingAdmin?.level || 1)}
                  required
                >
                  <option value="1">Level 1 · Barangay Tanod</option>
                  <option value="2">Level 2 · Secretary</option>
                  <option value="3">Level 3 · Punong Barangay</option>
                </select>
              </Field>
              <div className="form-grid">
                <Field
                  label="Contact number"
                  name="contact"
                  defaultValue={editingAdmin?.contact}
                  required
                />
                <Field
                  label="Barangay / Area"
                  name="address"
                  defaultValue={editingAdmin?.address}
                  required
                />
              </div>
              <div className="form-actions">
                <Button type="submit">
                  {editingAdmin ? "Save changes" : "Create admin"}
                </Button>
                <Button variant="text" onClick={() => setModal(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "announcement" &&
        role === "admin" &&
        effectiveAdminLevel === 3 && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div
            className="modal-panel"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="New announcement"
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <div className="eyebrow">COMMUNITY UPDATE</div>
            <h2>New announcement</h2>
            <p>Share an update with your residents.</p>
            <form className="stack-form" onSubmit={saveAnnouncement}>
              <Field
                label="Title"
                name="title"
                placeholder="Announcement title"
                required
              />
              <Field label="Category" name="category" required>
                <select name="category" required>
                  <option>Community</option>
                  <option>Health</option>
                  <option>Notice</option>
                  <option>Event</option>
                </select>
              </Field>
              <Field label="Description" name="description" required>
                <textarea
                  name="description"
                  rows={5}
                  required
                  placeholder="Write your announcement..."
                />
              </Field>
              <div className="form-actions">
                <Button type="submit">Publish announcement</Button>
                <Button variant="text" onClick={() => setModal(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "announcement-detail" && selectedAnnouncement && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div
            className="modal-panel"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selectedAnnouncement.title}
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <span className="update-category">
              {selectedAnnouncement.category}
            </span>
            <h2>{selectedAnnouncement.title}</h2>
            <p className="muted">{selectedAnnouncement.date}</p>
            <p>{selectedAnnouncement.description}</p>
            <Button variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
      {modal === "password" && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div
            className="modal-panel small"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Change password"
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <h2>Change password</h2>
            <p>Update your account password.</p>
            <form
              className="stack-form"
              onSubmit={(e) => {
                e.preventDefault()
                setModal(null)
                alert("Password updated for this prototype session.")
              }}
            >
              <Field
                label="Current password"
                name="current"
                type="password"
                required
              />
              <Field label="New password" name="new" type="password" required />
              <Button type="submit">Save password</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("light")
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = language === "fil" ? "fil" : "en"
    document.documentElement.style.colorScheme = theme
  }, [theme, language])

  return (
    <PreferencesContext.Provider
      value={{ theme, language, setTheme, setLanguage }}
    >
      <AppContent />
    </PreferencesContext.Provider>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: string
  tone: string
}) {
  const { language } = usePreferences()
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon tone-${tone}`}>
          <Icon name={icon} size={21} />
        </span>
        <Icon name="dots" size={19} />
      </div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <span>{translate(label, language)}</span>
    </div>
  )
}
