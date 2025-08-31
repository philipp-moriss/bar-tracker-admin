import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/core/components/ui/card";
import { EventsService } from "@/modules/events/events.service";
import { fierbaseApp } from "@/modules/firebase/config";
import { getAuth } from "firebase/auth";

export const HomePage = () => {
  const eventsService = new EventsService();

  const otherAuth = getAuth(fierbaseApp);
  otherAuth.onAuthStateChanged((user) => {
    console.log(user, "user");
    if (user) {
      console.log(user, "user");
    } else {
      console.log("user not found");
    }
  });

  eventsService.getAllEntities().then((cityList) => {
    console.log(cityList, "cityList");
  });

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-barTrekker-lightGrey to-white p-4">
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <Card className="shadow-xl border-0 bg-white w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-barTrekker-darkGrey">
              BarTrekker
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center font-bold text-orange-300">
            Welcome
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
