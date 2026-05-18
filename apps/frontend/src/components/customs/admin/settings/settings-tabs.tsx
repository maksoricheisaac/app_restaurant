"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedSettingsForm } from "./advanced-settings-form";
import { DeliveryZonesForm } from "./delivery-zones-form";
import { GeneralSettingsForm } from "./general-settings-form";
import { LimitsForm } from "./limits-form";
import { OpeningHoursForm } from "./opening-hours-form";
import { SocialLinksForm } from "./social-links-form";
import { PersonnelManagement } from "./personnel-management";
import { AdvancedPermissionsManagement } from "./advanced-permissions-management";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <div className="overflow-x-auto pb-2">
        <TabsList className="inline-flex w-full min-w-max md:grid md:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general" className="whitespace-nowrap">Général</TabsTrigger>
          <TabsTrigger value="opening-hours" className="whitespace-nowrap">Horaires</TabsTrigger>
          <TabsTrigger value="delivery-zones" className="whitespace-nowrap">Livraisons</TabsTrigger>
          <TabsTrigger value="limits" className="whitespace-nowrap">Limitations</TabsTrigger>
          <TabsTrigger value="social-links" className="whitespace-nowrap">Réseaux</TabsTrigger>
          <TabsTrigger value="personnel" className="whitespace-nowrap">Personnel</TabsTrigger>
          <TabsTrigger value="permissions" className="whitespace-nowrap">Permissions</TabsTrigger>
          <TabsTrigger value="advanced" className="whitespace-nowrap">Avancé</TabsTrigger>
        </TabsList>
      </div>

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
        <AdvancedPermissionsManagement />
      </TabsContent>
      <TabsContent value="advanced">
        <AdvancedSettingsForm />
      </TabsContent>
    </Tabs>
  );
}
 