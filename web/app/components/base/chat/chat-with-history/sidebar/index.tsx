import type { ReactNode } from 'react'
import {
  useCallback,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { ArrowLeftToLine, ArrowRightFromLine, BookOpenText, Home, Search, Settings } from 'lucide-react'
import { useChatWithHistoryContext } from '../context'
import List from './list'
import Button from '@/app/components/base/button'
import { Edit05 } from '@/app/components/base/icons/src/vender/line/general'
import type { ConversationItem } from '@/models/share'
import Confirm from '@/app/components/base/confirm'
import RenameModal from '@/app/components/base/chat/chat-with-history/sidebar/rename-modal'
import AppIcon from '@/app/components/base/app-icon'

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-y-3 w-full">{children}</div>
  )
}

const navLinks = [
  {
    icon: Home,
    // href: '/home',
    href: 'javascript:void(0)',
    label: '首页',
  },
  {
    icon: Search,
    // href: '/discover',
    href: 'javascript:void(0)',
    label: '发现',
  },
  {
    icon: BookOpenText,
    // href: '/library',
    href: 'javascript:void(0)',
    label: '历史',
  },
]

const Sidebar = () => {
  const { t } = useTranslation()
  const {
    appData,
    pinnedConversationList,
    conversationList,
    handleNewConversation,
    currentConversationId,
    handleChangeConversation,
    handlePinConversation,
    handleUnpinConversation,
    conversationRenaming,
    handleRenameConversation,
    handleDeleteConversation,
    isMobile,
  } = useChatWithHistoryContext()
  const [showConfirm, setShowConfirm] = useState<ConversationItem | null>(null)
  const [showRename, setShowRename] = useState<ConversationItem | null>(null)

  const handleOperate = useCallback((type: string, item: ConversationItem) => {
    if (type === 'pin')
      handlePinConversation(item.id)

    if (type === 'unpin')
      handleUnpinConversation(item.id)

    if (type === 'delete')
      setShowConfirm(item)

    if (type === 'rename')
      setShowRename(item)
  }, [handlePinConversation, handleUnpinConversation])
  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(null)
  }, [])
  const handleDelete = useCallback(() => {
    if (showConfirm)
      handleDeleteConversation(showConfirm.id, { onSuccess: handleCancelConfirm })
  }, [showConfirm, handleDeleteConversation, handleCancelConfirm])
  const handleCancelRename = useCallback(() => {
    setShowRename(null)
  }, [])
  const handleRename = useCallback((newName: string) => {
    if (showRename)
      handleRenameConversation(showRename.id, newName, { onSuccess: handleCancelRename })
  }, [showRename, handleRenameConversation, handleCancelRename])

  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={`shrink-0 h-full flex flex-col ${isCollapsed ? 'w-[93px]' : 'w-[200px]'} border-r border-r-gray-100`}>
      {
        !isMobile && (
          <div className='shrink-0 flex p-4'>
            {/* <AppIcon
              className='mr-3'
              size='small'
              iconType={appData?.site.icon_type}
              icon={appData?.site.icon}
              background={appData?.site.icon_background}
              imageUrl={appData?.site.icon_url}
            />
            <div className='py-1 text-base font-semibold text-gray-800'>
              {appData?.site.title}
            </div> */}
            <AppIcon
              className='mr-3'
              width={60}
              height={60}
              iconType={appData?.site.icon_type}
              icon={appData?.site.icon}
              background={appData?.site.icon_background}
              imageUrl={appData?.site.icon_url}
            />
            {/* <Image
              className='mr-3'
              src="/logo.png"
              alt="Log.AI"
              width={60}
              height={60}
            /> */}
            {!isCollapsed && <div className='text-lg font-semibold text-gray-800 text-2xl leading-[60px]'>
              Log.AI
            </div>}
          </div>
        )
      }
      <div className='shrink-0 p-4'>
        <Button
          variant='secondary-accent'
          className='justify-center w-full'
          onClick={handleNewConversation}
        >
          <Edit05 className={` ${isCollapsed ? '' : 'mr-2'} w-4 h-4`} />
          {!isCollapsed && '新建搜索'}
        </Button>
      </div>

      <div className='shrink-0 p-4'>
        <VerticalIconContainer>
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className='pl-4 relative flex flex-row items-center justify-start cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition w-full py-2 rounded-lg text-black/70'
            >
              <link.icon />
              {!isCollapsed && <p className="pl-4">{link.label}</p>}
            </Link>
          ))}
        </VerticalIconContainer>
      </div>

      {!isCollapsed && <div className='grow px-4 py-2 overflow-y-auto'>
        {
          !!pinnedConversationList.length && (
            <div className='mb-4'>
              <List
                isPin
                title={t('share.chat.pinnedTitle') || ''}
                list={pinnedConversationList}
                onChangeConversation={handleChangeConversation}
                onOperate={handleOperate}
                currentConversationId={currentConversationId}
              />
            </div>
          )
        }
        {
          !!conversationList.length && (
            <List
              title={(pinnedConversationList.length && t('share.chat.unpinnedTitle')) || ''}
              list={conversationList}
              onChangeConversation={handleChangeConversation}
              onOperate={handleOperate}
              currentConversationId={currentConversationId}
            />
          )
        }
      </div>}

      <div className='grow px-4 py-2 overflow-y-auto flex justify-end flex-col pb-8'>
        <button
          onClick={toggleSidebar}
          className="pb-8 flex pl-4"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed
            ? (
              <ArrowRightFromLine />
            )
            : (
              <ArrowLeftToLine />
            )}
          {!isCollapsed && <p className="pl-4">收起</p>}
        </button>
        <div className='cursor-pointer flex pl-4'>
          <Settings />
          {!isCollapsed && <p className="pl-4">设置</p>}
        </div>
      </div>

      {appData?.site.copyright && (
        <div className='px-4 pb-4 text-xs text-gray-400'>
          © {(new Date()).getFullYear()} {appData?.site.copyright}
        </div>
      )}
      {!!showConfirm && (
        <Confirm
          title={t('share.chat.deleteConversation.title')}
          content={t('share.chat.deleteConversation.content') || ''}
          isShow
          onCancel={handleCancelConfirm}
          onConfirm={handleDelete}
        />
      )}
      {showRename && (
        <RenameModal
          isShow
          onClose={handleCancelRename}
          saveLoading={conversationRenaming}
          name={showRename?.name || ''}
          onSave={handleRename}
        />
      )}
    </div>
  )
}

export default Sidebar
