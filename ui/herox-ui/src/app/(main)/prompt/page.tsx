import BoxCustom from "@/components/BoxCustom";
import TablePromptPost from "@/components/Table/TablePromptPost";

export default function PromptPostPage() {
  return (
    <div className="-mr-6">
      <BoxCustom>
        {/* title */}
        <div>
          <div className="flex items-center">
            <span className="w-[3px] h-5 bg-primary rounded-sm mr-2" />
            <h6 className="text-sm font-bold uppercase text-[#333335]">
              Manager Prompt Post
            </h6>
          </div>
          <p className="subtitle text-[#7987a1] fs-12 fw-normal ml-[11px]">
            This is the content of the Prompt Post page.
          </p>
        </div>
        {/* body */}
        <div className="mt-6">
          <TablePromptPost />
        </div>
      </BoxCustom>
    </div>
  );
}
