"use client";

import React, { useState } from "react";
import { addToast, Button, Form, Input } from "@heroui/react";
import billingService from "@/services/biling-service";
import ProfileCard from "@/components/animation/ProfileCard";
import GlassIcons from "@/components/animation/GlassIcons";
import Lightning from "@/components/animation/Lightning";

export interface IAdmin {
  _id?: string;
  fullName: string;
  type: "admin" | "member";
  permisson?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}
export interface IDataResGetPaymentSuccess {
  member: IAdmin | null;
  billing: {
    count: number;
  };
}

export default function FormCheckActivity() {
  const [data, setData] = useState<null | IDataResGetPaymentSuccess>(null);
  const [key, setKey] = useState("");

  const onSubmit = async () => {
    console.log(key);

    if (key.trim()) {
      // call api
      try {
        const dataRes = await billingService.getInfoBilling(key);
        const data = dataRes.data.data;
        console.log("data: ", data);
        setData(data);
        addToast({
          title: "Successfully",
          variant: "flat",
          color: "success",
          description: "Get data okie",
        });
      } catch (error) {
        if (error instanceof Error) {
          console.log("error: ", error);
          addToast({
            title: "Error",
            variant: "flat",
            color: "danger",
            description: error.message,
          });
        } else {
          console.log("Unknown error: ", error);
          addToast({
            title: "Error",
            color: "danger",
            variant: "flat",
            description: "Something went wrong.",
          });
        }
      }
    }
  };

  return (
    <div className="flex items-center">
      {data ? (
        <div>
          <ProfileCard className="min-w-3xl min-h-7 mt-8 flex gap-5 relative z-200">
            <div className="font-bold text-large flex gap-3 px-16 py-20 ">
              <GlassIcons
                items={[
                  {
                    icon: (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-frown"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                          <line x1="9" y1="9" x2="9.01" y2="9" />
                          <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                      </>
                    ),
                    color: "#7b6f6f",
                    label: "hi",
                  },
                ]}
                className="custom-class"
              />

              <div className="ml-10">
                <h4>{data?.member?.fullName}</h4>
                <small className="text-default-500">
                  Số lần sử dụng: {data?.billing.count}
                </small>
              </div>
            </div>

            <div className="">
              <Lightning
                hue={220}
                xOffset={0}
                speed={1}
                intensity={1}
                size={1}
              />
            </div>
          </ProfileCard>
        </div>
      ) : (
        <Form
          className="w-full max-w-xl flex justify-center gap-4 flex-row mt-12 min-w-xl relative z-200"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            labelPlacement="outside"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            name="key"
            placeholder="Enter your key"
          />
          <Button type="submit" variant="faded" onPress={onSubmit}>
            Submit
          </Button>
        </Form>
      )}
    </div>
  );
}
