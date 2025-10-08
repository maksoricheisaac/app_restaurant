"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedSettingsForm } from "./advanced-settings-form";
import { DeliveryZonesForm } from "./delivery-zones-form";
import { GeneralSettingsForm } from "./general-settings-form";
import { LimitsForm } from "./limits-form";
import { OpeningHoursForm } from "./opening-hours-form";
import { SocialLinksForm } from "./social-links-form";
import { PersonnelManagement } from "./personnel-management";
import { PermissionsManagement } from "./permissions-management";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <TabsTrigger value="general">Général</TabsTrigger>
        <TabsTrigger value="opening-hours">Horaires</TabsTrigger>
        <TabsTrigger value="delivery-zones">Livraisons</TabsTrigger>
        <TabsTrigger value="limits">Limitations</TabsTrigger>
        <TabsTrigger value="social-links">Réseaux sociaux</TabsTrigger>
        <TabsTrigger value="personnel">Personnel</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="advanced">Avancé</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralSettingsForm />
      </TabsContent>
      <TabsContent value="opening-hours">
        <OpeningHoursForm />
      </TabsContent>
      <TabsContent value="delivery-zones">
        <DeliveryZonesForm />
      </TabsContent>
      <TabsContent value="limits">
        <LimitsForm />
      </TabsContent>
      <TabsContent value="social-links">
        <SocialLinksForm />
      </TabsContent>
      <TabsContent value="personnel">
        <PersonnelManagement />
      </TabsContent>
      <TabsContent value="permissions">
        <PermissionsManagement />
      </TabsContent>
      <TabsContent value="advanced">
        <AdvancedSettingsForm />
      </TabsContent>
    </Tabs>
  );
}
 