import styled from "styled-components";
import tw from "twin.macro";

export const Tabs = tw.nav`
    flex
    flex-wrap
    items-center
    relative
    border-[#333]
    mx-auto    
`;

export const Tab = styled.div<{
  $partiallyactive: string;
  disabled?: boolean;
}>(({ $partiallyactive, disabled }) => [
  tw`
    my-1
    sm:m-2
    md:ml-4
    mr-2
    px-3
    py-2    
    font-medium
    text-sm
    leading-5
    rounded-md
    focus:outline-none
    flex
    items-center
    `,
  disabled
    ? tw`
        text-[#555]
        bg-black
        hover:text-[#555]
        hover:bg-black
        cursor-default
        transition
        `
    : $partiallyactive === "true"
    ? tw`
        text-[#AAA]
        bg-[#111]
        focus:bg-[#222]
        hover:text-[#AAA]
        focus:outline-none 
        focus:ring 
        focus:border-purple-300
        `
    : tw`
        text-[#777]
        hover:text-yellow-400
        focus:text-white
        focus:bg-[#444]
        `,
]);
