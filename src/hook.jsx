import { useEffect, useState } from 'react';
import emitter from './emitter';

const selectVariant = (currentVariant) => (variants, fallback) => {
  if (currentVariant in variants) {
    return variants[currentVariant];
  }
  return fallback;
};

const useExperiment = (experimentName, userIdentifier, defaultVariantName) => {
  const [activeVariant, setActiveVariant] = useState(
    emitter.calculateActiveVariant(
      experimentName,
      userIdentifier,
      defaultVariantName
    )
  );

  useEffect(() => {
    emitter._incrementActiveExperiments(experimentName);
    emitter.setActiveVariant(experimentName, activeVariant);
    emitter._emitView(experimentName, activeVariant);

    const variantListener = emitter.addActiveVariantListener(
      experimentName,
      (name, variant) => {
        if (name === experimentName && variant !== activeVariant) {
          setActiveVariant(variant);
        }
      }
    );
    return () => {
      variantListener.remove();
      emitter._decrementActiveExperiments(experimentName);
    };
  }, [experimentName, activeVariant]);

  return {
    experimentName,
    activeVariant,
    emitClick: () => emitter.emitClick(experimentName),
    selectVariant: selectVariant(activeVariant),
  };
};

export default useExperiment;
