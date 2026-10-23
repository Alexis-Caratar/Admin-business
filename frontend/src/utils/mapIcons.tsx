import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MenuIcon from "@mui/icons-material/Menu";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CategoryIcon from "@mui/icons-material/Category";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SettingsIcon from "@mui/icons-material/Settings";
import CampaignIcon from "@mui/icons-material/Campaign";


export const iconMap: Record<string, React.ReactNode> = {
  PersonIcon: <PersonIcon />,
  StoreIcon: <StoreIcon />,
  MenuBookIcon: <MenuBookIcon />,
  ShoppingCartIcon: <ShoppingCartIcon />,
  Inventory2Icon:<Inventory2Icon/>,
  BusinessCenterIcon:<BusinessCenterIcon/>,
  CategoryIcon:<CategoryIcon/>,
  PointOfSaleIcon:<PointOfSaleIcon/>,
  ReceiptLongIcon:<ReceiptLongIcon/>,
  AccountBalanceIcon:<AccountBalanceIcon/>,
  RoomServiceIcon:<RoomServiceIcon/>,
  TableRestaurantIcon:<TableRestaurantIcon/>,
  AdminPanelSettingsIcon:<AdminPanelSettingsIcon/>,
  ManageAccountsIcon:<ManageAccountsIcon/>,
  SettingsIcon:<SettingsIcon/>,
  CampaignIcon:<CampaignIcon/>,
  default: <MenuIcon />   // default
};
