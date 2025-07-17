"use client";

import React from "react";
import BoxCustom from "@/components/BoxCustom";
import TableProjectManager from "@/components/Table/TableProjectManager";

export default function ProjectPage() {
  return (
    <div className="-mr-6">
      <BoxCustom>
        {/* title */}
        <div>
          <div className="flex items-center">
            <span className="w-[3px] h-5 bg-primary rounded-sm mr-2" />
            <h6 className="text-sm font-bold uppercase text-[#333335]">
              Project Manager
            </h6>
          </div>
          <p className="subtitle text-[#7987a1] fs-12 fw-normal ml-[11px]">
            Create and manage projects for your organization
          </p>
        </div>
        {/* body */}
        <div className="mt-6">
          <TableProjectManager />
        </div>
      </BoxCustom>
    </div>
  );
}
