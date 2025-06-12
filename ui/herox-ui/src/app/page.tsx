import BlurText from "@/components/animation/BlurText";
import ParticlesBackground from "@/components/animation/ParticlesBackground";
import TrueFocus from "@/components/animation/TrueFocus";
import FormCheckActivity from "@/components/ui/form/form-check";

export default function Home() {
  return (
    <>
      <div className=" absolute inset-0">
        <ParticlesBackground className="h-full w-full " />
      </div>
      <div className="flex justify-center">
        <div className="my-40 ">
          <div className="flex flex-col items-center ">
            <BlurText
              text="See Your Activity"
              className="text-white text-6xl"
            />
            <div className="text-[#757e93] mt-4">
              <TrueFocus
                sentence="Usage stats that make sense — clear, simple, powerful"
                glowColor="#757e93"
              ></TrueFocus>
            </div>
            <FormCheckActivity />
          </div>
        </div>
      </div>
    </>
  );
}
