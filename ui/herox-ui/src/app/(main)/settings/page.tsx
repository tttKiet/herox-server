"use client";

import React from "react";
import SettingsForm from "@/components/Settings/SettingsForm";
import BoxCustom from "@/components/BoxCustom";

export default function SettingsPage() {
  return (
    <div className="-mr-6">
      <BoxCustom>
        {/* title */}
        <div>
          <div className="flex items-center">
            <span className="w-[3px] h-5 bg-primary rounded-sm mr-2" />
            <h6 className="text-sm font-bold uppercase text-[#333335]">
              SETTING BOT
            </h6>
          </div>
          <p className="subtitle text-[#7987a1] fs-12 fw-normal ml-[11px]">
            Properties for bot Telegram and X interaction features
          </p>
        </div>

        {/* body */}
        <div className="mt-6">
          <SettingsForm />
        </div>
      </BoxCustom>
    </div>
  );
}
