"use client";

import React from "react";
import { Button, Form, Input } from "@heroui/react";

export default function FormCheckActivity() {
  const [submitted, setSubmitted] = React.useState(null);

  const onSubmit = (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    setSubmitted(data);
  };

  return (
    <Form
      className="w-full max-w-xl flex justify-center gap-4 flex-row mt-12"
      onSubmit={onSubmit}
    >
      <Input labelPlacement="outside" name="key" placeholder="Enter your key" />
      <Button type="submit" variant="faded">
        Submit
      </Button>
    </Form>
  );
}
