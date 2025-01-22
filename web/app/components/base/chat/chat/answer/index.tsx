import type { FC, ReactNode } from 'react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import type { ChatConfig, ChatItem, WorkflowProcess } from '../../types'
import Operation from './operation'
import AgentContent from './agent-content'
import BasicContent from './basic-content'
import SuggestedQuestions from './suggested-questions'
import More from './more'
import WorkflowProcessItem from './workflow-process'
import MessageSources from './MessageSources'
import LoadingAnim from '@/app/components/base/chat/chat/loading-anim'
import Citation from '@/app/components/base/chat/chat/citation'
import { EditTitle } from '@/app/components/app/annotation/edit-annotation-modal/edit-item'
import type { AppData } from '@/models/share'
import { ChevronRight } from '@/app/components/base/icons/src/vender/line/arrows'
import cn from '@/utils/classnames'
import { FileList } from '@/app/components/base/file-uploader'
import { fetchTracingList } from '@/service/log'
import type { NodeTracing } from '@/types/workflow'
import { BlockEnum, WorkflowRunningStatus } from '@/app/components/workflow/types'
import { ToastContext } from '@/app/components/base/toast'

type AnswerProps = {
  item: ChatItem
  question: string
  index: number
  config?: ChatConfig
  answerIcon?: ReactNode
  responding?: boolean
  showPromptLog?: boolean
  chatAnswerContainerInner?: string
  hideProcessDetail?: boolean
  appData?: AppData
  noChatInput?: boolean
  switchSibling?: (siblingMessageId: string) => void
}
const Answer: FC<AnswerProps> = ({
  item,
  question,
  index,
  config,
  answerIcon,
  responding,
  showPromptLog,
  chatAnswerContainerInner,
  hideProcessDetail,
  appData,
  noChatInput,
  switchSibling,
}) => {
  const { t } = useTranslation()
  const {
    content,
    citation,
    agent_thoughts,
    more,
    annotation,
    workflowProcess,
    allFiles,
    message_files,
  } = item

  console.log('workflowProcess', workflowProcess)
  const hasAgentThoughts = !!agent_thoughts?.length

  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [messageSources, setMessageSources] = useState([])

  const [oldWorkflowProcess, setOldWorkflowProcess] = useState<WorkflowProcess>()

  const getContainerWidth = () => {
    if (containerRef.current)
      setContainerWidth(containerRef.current?.clientWidth + 16)
  }
  useEffect(() => {
    getContainerWidth()
  }, [])

  const getContentWidth = () => {
    if (contentRef.current)
      setContentWidth(contentRef.current?.clientWidth)
  }

  useEffect(() => {
    if (!responding)
      getContentWidth()
  }, [responding])

  // Recalculate contentWidth when content changes (e.g., SVG preview/source toggle)
  useEffect(() => {
    const tracing = workflowProcess?.tracing
    if (tracing) {
      console.log('tracing', tracing)
      const tracingItem = tracing.find(item => item.title === 'SearXNG 搜索')
      if (tracingItem) {
        console.log('tracingItem', tracingItem)
        const outputs = tracingItem.outputs
        if (outputs && outputs.json) {
          const json = outputs.json
          setMessageSources(json)
          console.log('json', json)
          // const jsonString = JSON.stringify(json)
          // const jsonObject = JSON.parse(jsonString)
          // const sources = jsonObject.sources
          // if (sources) {
          //   const sourcesArray = Object.values(sources)
          //   const sourcesString = JSON.stringify(sourcesArray)
          // }
        }
      }
    }

    if (!containerRef.current)
      return
    const resizeObserver = new ResizeObserver(() => {
      getContentWidth()
    })
    resizeObserver.observe(containerRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 增加获取节点信息
  const { notify } = useContext(ToastContext)
  const [list, setList] = useState<NodeTracing[]>([])

  const formatNodeList = useCallback((list: NodeTracing[]) => {
    const allItems = [...list].reverse()
    const result: NodeTracing[] = []
    const nodeGroupMap = new Map<string, Map<string, NodeTracing[]>>()

    const processIterationNode = (item: NodeTracing) => {
      result.push({
        ...item,
        details: [],
      })
    }

    const updateParallelModeGroup = (runId: string, item: NodeTracing, iterationNode: NodeTracing) => {
      if (!nodeGroupMap.has(iterationNode.node_id))
        nodeGroupMap.set(iterationNode.node_id, new Map())

      const groupMap = nodeGroupMap.get(iterationNode.node_id)!

      if (!groupMap.has(runId)) {
        groupMap.set(runId, [item])
      }
      else {
        if (item.status === 'retry') {
          const retryNode = groupMap.get(runId)!.find(node => node.node_id === item.node_id)

          if (retryNode) {
            if (retryNode?.retryDetail)
              retryNode.retryDetail.push(item)
            else
              retryNode.retryDetail = [item]
          }
        }
        else {
          groupMap.get(runId)!.push(item)
        }
      }

      if (item.status === 'failed') {
        iterationNode.status = 'failed'
        iterationNode.error = item.error
      }

      iterationNode.details = Array.from(groupMap.values())
    }
    const updateSequentialModeGroup = (index: number, item: NodeTracing, iterationNode: NodeTracing) => {
      const { details } = iterationNode
      if (details) {
        if (!details[index]) {
          details[index] = [item]
        }
        else {
          if (item.status === 'retry') {
            const retryNode = details[index].find(node => node.node_id === item.node_id)

            if (retryNode) {
              if (retryNode?.retryDetail)
                retryNode.retryDetail.push(item)
              else
                retryNode.retryDetail = [item]
            }
          }
          else {
            details[index].push(item)
          }
        }
      }

      if (item.status === 'failed') {
        iterationNode.status = 'failed'
        iterationNode.error = item.error
      }
    }
    const processNonIterationNode = (item: NodeTracing) => {
      const { execution_metadata } = item
      if (!execution_metadata?.iteration_id) {
        if (item.status === 'retry') {
          const retryNode = result.find(node => node.node_id === item.node_id)

          if (retryNode) {
            if (retryNode?.retryDetail)
              retryNode.retryDetail.push(item)
            else
              retryNode.retryDetail = [item]
          }

          return
        }
        result.push(item)
        return
      }

      const iterationNode = result.find(node => node.node_id === execution_metadata.iteration_id)
      if (!iterationNode || !Array.isArray(iterationNode.details))
        return

      const { parallel_mode_run_id, iteration_index = 0 } = execution_metadata

      if (parallel_mode_run_id)
        updateParallelModeGroup(parallel_mode_run_id, item, iterationNode)
      else
        updateSequentialModeGroup(iteration_index, item, iterationNode)
    }

    allItems.forEach((item) => {
      item.node_type === BlockEnum.Iteration
        ? processIterationNode(item)
        : processNonIterationNode(item)
    })

    return result
  }, [])

  const getTracingList = useCallback(async (appID: string, runID: string) => {
    try {
      const { data: nodeList } = await fetchTracingList({
        url: `/apps/${appID}/workflow-runs/${runID}/node-executions`,
      })
      setList(formatNodeList(nodeList))
    }
    catch (err) {
      notify({
        type: 'error',
        message: `${err}`,
      })
    }
  }, [notify])

  const getData = async (appID: string, runID: string) => {
    await getTracingList(appID, runID)
  }

  useEffect(() => {
    console.log(appData, item)
    if (appData?.app_id && item?.workflow_run_id)
      getData(appData.app_id, item.workflow_run_id)
  }, [appData?.app_id, item.workflow_run_id])

  useEffect(() => {
    console.log('list', list)
    if (list.length > 0) {
      const tracingItem = list.find(item => item.title === 'SearXNG 搜索')
      if (tracingItem) {
        console.log('tracingItem', tracingItem)
        const outputs = tracingItem.outputs
        if (outputs && outputs.json) {
          const json = outputs.json
          setMessageSources(json)
          console.log('json', json)
        }
      }

      const workflowProcess = {
        status: WorkflowRunningStatus.Succeeded,
        tracing: list,
      }
      setOldWorkflowProcess(workflowProcess)
    }
  }, [list])

  return (
    <div>

      <h3 className="text-black font-medium text-xl my-2">
        思考过程
      </h3>

      {!workflowProcess && oldWorkflowProcess && !hideProcessDetail && (
        <WorkflowProcessItem
          data={oldWorkflowProcess}
          item={item}
          expand={true}
          hideProcessDetail={hideProcessDetail}
        />
      )}
      {!workflowProcess && oldWorkflowProcess && hideProcessDetail && appData && (
        <WorkflowProcessItem
          data={oldWorkflowProcess}
          item={item}
          expand={true}
          hideProcessDetail={hideProcessDetail}
          readonly={!appData.site.show_workflow_steps}
        />
      )}

      {workflowProcess && !hideProcessDetail && (
        <WorkflowProcessItem
          data={workflowProcess}
          item={item}
          expand={true}
          hideProcessDetail={hideProcessDetail}
        />
      )}
      {workflowProcess && hideProcessDetail && appData && (
        <WorkflowProcessItem
          data={workflowProcess}
          item={item}
          expand={true}
          hideProcessDetail={hideProcessDetail}
          readonly={!appData.site.show_workflow_steps}
        />
      )}

      {messageSources.length > 0
            && <div className="flex flex-col space-y-2 my-2" >
              <div className="flex flex-row items-center space-x-2">
                <h3 className="text-black font-medium text-xl">
                  来源
                </h3>
              </div>
              <MessageSources
                sources={messageSources}
              ></MessageSources>
            </div>
      }

      <h3 className="text-black font-medium text-xl my-2">
        答案
      </h3>
      <div className="flex mb-2 last:mb-0">
        {/* <div className='shrink-0 relative w-10 h-10'>
          {answerIcon || <AnswerIcon />}
          {responding && (
            <div className='absolute -top-[3px] -left-[3px] pl-[6px] flex items-center w-4 h-4 bg-white rounded-full shadow-xs border-[0.5px] border-gray-50'>
              <LoadingAnim type='avatar' />
            </div>
          )}
        </div> */}
        <div
          className="chat-answer-container group grow w-0"
          ref={containerRef}
        >
          <div className={cn('group relative', chatAnswerContainerInner)}>
            <div
              ref={contentRef}
              className={cn(
                'w-full relative inline-block px-4 py-3 max-w-full bg-chat-bubble-bg rounded-2xl body-lg-regular text-text-primary',
                workflowProcess && 'w-full',
              )}
            >
              {!responding && (
                <Operation
                  hasWorkflowProcess={!!workflowProcess}
                  maxSize={containerWidth - contentWidth - 4}
                  contentWidth={contentWidth}
                  item={item}
                  question={question}
                  index={index}
                  showPromptLog={showPromptLog}
                  noChatInput={noChatInput}
                />
              )}
              {responding && !content && !hasAgentThoughts && (
                <div className="flex items-center justify-center w-6 h-5">
                  <LoadingAnim type="text" />
                </div>
              )}
              {content && !hasAgentThoughts && <BasicContent item={item} />}
              {hasAgentThoughts && (
                <AgentContent item={item} responding={responding} />
              )}
              {!!allFiles?.length && (
                <FileList
                  className="my-1"
                  files={allFiles}
                  showDeleteAction={false}
                  showDownloadAction
                  canPreview
                />
              )}
              {!!message_files?.length && (
                <FileList
                  className="my-1"
                  files={message_files}
                  showDeleteAction={false}
                  showDownloadAction
                  canPreview
                />
              )}
              {annotation?.id && annotation.authorName && (
                <EditTitle
                  className="mt-1"
                  title={t('appAnnotation.editBy', {
                    author: annotation.authorName,
                  })}
                />
              )}
              <SuggestedQuestions item={item} />
              {!!citation?.length && !responding && (
                <Citation
                  data={citation}
                  showHitInfo={config?.supportCitationHitInfo}
                />
              )}
              {item.siblingCount
                && item.siblingCount > 1
                && item.siblingIndex !== undefined && (
                <div className="pt-3.5 flex justify-center items-center text-sm">
                  <button
                    className={`${
                      item.prevSibling ? 'opacity-100' : 'opacity-65'
                    }`}
                    disabled={!item.prevSibling}
                    onClick={() =>
                      item.prevSibling && switchSibling?.(item.prevSibling)
                    }
                  >
                    <ChevronRight className="w-[14px] h-[14px] rotate-180 text-text-tertiary" />
                  </button>
                  <span className="px-2 text-xs text-text-quaternary">
                    {item.siblingIndex + 1} / {item.siblingCount}
                  </span>
                  <button
                    className={`${
                      item.nextSibling ? 'opacity-100' : 'opacity-65'
                    }`}
                    disabled={!item.nextSibling}
                    onClick={() =>
                      item.nextSibling && switchSibling?.(item.nextSibling)
                    }
                  >
                    <ChevronRight className="w-[14px] h-[14px] text-text-tertiary" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <More more={more} />
        </div>
      </div>
    </div>
  )
}

export default memo(Answer)
