import type {
  FC,
  ReactNode,
} from 'react'
import {
  memo,
} from 'react'
import type { ChatItem } from '../types'
import type { Theme } from '../embedded-chatbot/theme/theme-context'

type QuestionProps = {
  item: ChatItem
  questionIcon?: ReactNode
  theme: Theme | null | undefined
}
const Question: FC<QuestionProps> = ({
  item,
  questionIcon,
  theme,
}) => {
  const {
    content,
    message_files,
  } = item
  return (
    <div className="w-full">
      <h2 className="text-black font-medium text-3xl lg:w-9/12">
        {content}
      </h2>
    </div>
    // <Markdown content={content} />
    // <div className='flex justify-end mb-2 last:mb-0 pl-14'>
    //   <div className='group relative mr-4 max-w-full'>
    //     <div
    //       className='px-4 py-3 bg-[#D1E9FF]/50 rounded-2xl text-sm text-gray-900'
    //       style={theme?.chatBubbleColorStyle ? CssTransform(theme.chatBubbleColorStyle) : {}}
    //     >
    //       {
    //         !!message_files?.length && (
    //           <FileList
    //             files={message_files}
    //             showDeleteAction={false}
    //             showDownloadAction={true}
    //           />
    //         )
    //       }
    //       <Markdown content={content} />
    //     </div>
    //     <div className='mt-1 h-[18px]' />
    //   </div>
    //   <div className='shrink-0 w-10 h-10'>
    //     {
    //       questionIcon || (
    //         <div className='w-full h-full rounded-full border-[0.5px] border-black/5'>
    //           <User className='w-full h-full' />
    //         </div>
    //       )
    //     }
    //   </div>
    // </div>
  )
}

export default memo(Question)
