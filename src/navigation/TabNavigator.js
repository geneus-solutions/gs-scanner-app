
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ScannerScreen from "../screens/ScannerScreen";
import PollingScreen from "../screens/PollingScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Polling" component={PollingScreen} />
    </Tab.Navigator>
  );
}
