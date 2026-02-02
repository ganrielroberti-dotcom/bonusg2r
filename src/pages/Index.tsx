import { BonusProvider } from "@/contexts/BonusContext";
import { BonusApp } from "@/components/bonus/BonusApp";

const Index = () => {
  return (
    <BonusProvider>
      <BonusApp />
    </BonusProvider>
  );
};

export default Index;
