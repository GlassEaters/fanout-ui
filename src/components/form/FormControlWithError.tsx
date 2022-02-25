import { FormLabel, FormControl, FormHelperText, useColorModeValue } from "@chakra-ui/react";
import React from "react";

export interface IFormControlWithErrorProps<A> {
  children: React.ReactNode;
  errors: any;
  id: string;
  help?: string;
  label?: string;
}
export function FormControlWithError<A>({ id, label, help, children, errors, ...rest }: IFormControlWithErrorProps<A>) {
  return <FormControl color={useColorModeValue("black", "white")} id={id} {...rest}>
    {label && <FormLabel htmlFor={id}>{ label }</FormLabel>}
    {children}
    {(errors[id] || help) && <FormHelperText color={errors[id]?.message ? "red.400" : "gray.200"}>
      {errors[id]?.message || help}
    </FormHelperText>}
  </FormControl>
}
